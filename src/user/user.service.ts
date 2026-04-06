import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './user.entity';
import { CreateUserDto } from './user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  findAll(tenantId: string): Promise<Omit<User, 'password'>[]> {
    return this.users.find({
      where: { tenantId },
      order: { name: 'ASC' },
      select: ['id', 'name', 'email', 'phone', 'role', 'active'],
    }) as Promise<Omit<User, 'password'>[]>;
  }

  async create(
    tenantId: string,
    dto: CreateUserDto,
  ): Promise<Omit<User, 'password'>> {
    // ADMIN cannot create another ADMIN ou SUPER_ADMIN
    if (dto.role === UserRole.ADMIN || dto.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Não é permitido criar usuários com perfil ADMIN ou SUPER_ADMIN',
      );
    }

    const existing = await this.users.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('E-mail já está em uso');
    }

    const user = this.users.create({
      name: dto.name,
      email: dto.email,
      password: await bcrypt.hash(dto.password, 10),
      phone: dto.phone ?? undefined,
      role: dto.role,
      tenantId,
      active: true,
    });

    const saved = await this.users.save(user);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _pw, ...rest } = saved as User;
    return rest as Omit<User, 'password'>;
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const user = await this.users.findOne({ where: { id, tenantId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    await this.users.remove(user);
  }
}
