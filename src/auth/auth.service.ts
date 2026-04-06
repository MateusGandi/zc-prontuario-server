import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { StringValue } from 'ms';
import { Repository, DataSource } from 'typeorm';
import { TokenPayload } from './auth.guard';
import { User, UserRole } from '../user/user.entity';
import { Tenant } from '../tenant/tenant.entity';
import { LoginDto, RegisterDto } from './auth.dto';
import { TenantDataSourceService } from '../database/tenant-data-source.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
    private readonly tenantDs: TenantDataSourceService,
  ) {}

  async register({ name, email, password, phone, tenantName }: RegisterDto) {
    const existingUser = await this.users.findOne({ where: { email } });
    if (existingUser) throw new UnauthorizedException('E-mail já está em uso');

    const tenantId = randomUUID();
    const schemaName = `tenant_${tenantId.replace(/-/g, '')}`;

    // 1. Criar tenant e usuário na transação central
    const savedUser = await this.dataSource.transaction(async (manager) => {
      const tenant = manager.create(Tenant, {
        id: tenantId,
        name: tenantName,
        schemaName,
      });
      const savedTenant = await manager.save(tenant);

      const user = manager.create(User, {
        name,
        email,
        password: await bcrypt.hash(password, 10),
        phone: phone ?? '',
        tenantId: savedTenant.id,
        role: UserRole.ADMIN,
      });
      return manager.save(user);
    });

    // 2. Criar schema PostgreSQL e aplicar migrations do tenant
    //    Se falhar, desfaz o tenant e usuário para evitar dado pela metade
    try {
      await this.dataSource.query(
        `CREATE SCHEMA IF NOT EXISTS "${schemaName}"`,
      );
      await this.tenantDs.applyMigrations(schemaName);
    } catch (err) {
      await this.dataSource.query(`DELETE FROM "users" WHERE id = $1`, [
        savedUser.id,
      ]);
      await this.dataSource.query(`DELETE FROM "tenants" WHERE id = $1`, [
        tenantId,
      ]);
      await this.dataSource.query(
        `DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`,
      );
      throw err;
    }

    return this.sign(savedUser, schemaName);
  }

  async login({ email, password }: LoginDto) {
    const user = await this.users.findOne({
      where: { email },
      relations: ['tenant'],
    });
    if (!user) throw new UnauthorizedException('Credenciais inválidas');

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new UnauthorizedException('Credenciais inválidas');

    return this.sign(user, user.tenant.schemaName);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<TokenPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET ?? 'refresh-secret',
      });
      const user = await this.users.findOne({
        where: { id: payload.sub },
        relations: ['tenant'],
      });
      if (!user) throw new Error();
      return this.sign(user, user.tenant.schemaName);
    } catch {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }
  }

  private sign(user: User, schemaName: string) {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      tenantSchema: schemaName,
    };
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, {
        secret: process.env.JWT_REFRESH_SECRET ?? 'refresh-secret',
        expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as StringValue,
      }),
    };
  }
}
