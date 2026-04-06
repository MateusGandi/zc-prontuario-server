import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './tenant.entity';
import { TenantDataSourceService } from '../database/tenant-data-source.service';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenants: Repository<Tenant>,
    private readonly tenantDs: TenantDataSourceService,
  ) {}

  findById(id: string): Promise<Tenant | null> {
    return this.tenants.findOne({ where: { id } });
  }

  /** Todos os tenants (ativos e inativos) — para o super admin */
  findAllForSuperAdmin(): Promise<Tenant[]> {
    return this.tenants.find({ order: { createdAt: 'DESC' } });
  }

  findAll(): Promise<Tenant[]> {
    return this.tenants.find({ where: { active: true } });
  }

  async toggleActive(id: string): Promise<Tenant> {
    const tenant = await this.tenants.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant não encontrado');
    tenant.active = !tenant.active;
    return this.tenants.save(tenant);
  }

  async create(name: string): Promise<Tenant> {
    const schemaName =
      'tenant_' +
      name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 40) +
      '_' +
      Date.now().toString(36);

    const existing = await this.tenants.findOne({ where: { schemaName } });
    if (existing) {
      throw new ConflictException('Tenant com este nome já existe.');
    }

    const tenant = this.tenants.create({ name, schemaName });
    const saved = await this.tenants.save(tenant);

    await this.tenantDs.applyMigrations(schemaName);

    return saved;
  }
}
