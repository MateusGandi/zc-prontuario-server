import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { StringValue } from 'ms';
import { Repository, DataSource } from 'typeorm';
import { TokenPayload } from './auth.guard';
import { User, UserRole } from '../user/user.entity';
import { Tenant } from '../tenant/tenant.entity';
import { LoginDto, RegisterDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {}

  async register({ name, email, password, phone, tenantName }: RegisterDto) {
    const existingUser = await this.users.findOne({ where: { email } });
    if (existingUser) throw new UnauthorizedException('E-mail já está em uso');

    return this.dataSource.transaction(async (manager) => {
      // 1. Criar o Tenant admin/primário para este usuário
      const tenant = new Tenant();
      tenant.name = tenantName;
      const savedTenant = await manager.save(tenant);

      // 2. Criar o Usuário com role ADMIN associado ao Tenant recém criado
      const user = new User();
      user.name = name;
      user.email = email;
      user.password = await bcrypt.hash(password, 10);
      user.phone = phone || '';
      user.tenantId = savedTenant.id;
      user.role = UserRole.ADMIN;
      const savedUser = await manager.save(user);

      // 3. Retornar os tokens para login automático
      return this.sign(savedUser);
    });
  }

  async login({ email, password }: LoginDto) {
    const user = await this.users.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('Credenciais inválidas');

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new UnauthorizedException('Credenciais inválidas');

    return this.sign(user);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<TokenPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET ?? 'refresh-secret',
      });
      const user = await this.users.findOne({ where: { id: payload.sub } });
      if (!user) throw new Error();
      return this.sign(user);
    } catch {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }
  }

  private sign(user: User) {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
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
