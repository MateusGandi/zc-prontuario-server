import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './tenant.entity';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenants: Repository<Tenant>,
  ) {}

  findById(id: string): Promise<Tenant | null> {
    return this.tenants.findOne({ where: { id } });
  }

  findAll(): Promise<Tenant[]> {
    return this.tenants.find({ where: { active: true } });
  }
}
