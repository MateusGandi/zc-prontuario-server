import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { Appointment } from '../appointment/appointment.entity';
import { CreateTenantSchema1775232000001 } from '../migrations/tenant/1775232000001-CreateTenantSchema';

@Injectable()
export class TenantDataSourceService implements OnModuleDestroy {
  private readonly cache = new Map<string, DataSource>();

  constructor(private readonly config: ConfigService) {}

  async getDataSource(tenantSchema: string): Promise<DataSource> {
    if (this.cache.has(tenantSchema)) {
      const ds = this.cache.get(tenantSchema)!;
      if (!ds.isInitialized) await ds.initialize();
      return ds;
    }

    const ds = new DataSource({
      type: 'postgres',
      host: this.config.get<string>('DB_HOST', 'localhost'),
      port: this.config.get<number>('DB_PORT', 5432),
      username: this.config.get<string>('DB_USER', 'admin'),
      password: this.config.get<string>('DB_PASS', 'admin_password'),
      database: this.config.get<string>('DB_NAME', 'zc_prontuario'),
      schema: tenantSchema,
      entities: [Appointment],
      migrations: [CreateTenantSchema1775232000001],
      migrationsTableName: 'tenant_migrations',
    });

    await ds.initialize();
    this.cache.set(tenantSchema, ds);
    return ds;
  }

  /**
   * Cria o schema PostgreSQL e aplica as migrations do tenant.
   * Chamado automaticamente ao registrar um novo tenant.
   */
  async applyMigrations(tenantSchema: string): Promise<void> {
    const ds = await this.getDataSource(tenantSchema);
    await ds.runMigrations();
  }

  async onModuleDestroy(): Promise<void> {
    const closes = [...this.cache.values()]
      .filter((ds) => ds.isInitialized)
      .map((ds) => ds.destroy());
    await Promise.all(closes);
  }
}
