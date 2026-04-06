import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { TenantService } from './tenant/tenant.service';
import { TenantDataSourceService } from './database/tenant-data-source.service';

@Injectable()
export class AppService implements OnModuleInit {
  private readonly logger = new Logger(AppService.name);

  constructor(
    private readonly tenantService: TenantService,
    private readonly tenantDs: TenantDataSourceService,
  ) {}

  async onModuleInit(): Promise<void> {
    const tenants = await this.tenantService.findAll();
    this.logger.log(`Running migrations for ${tenants.length} tenant(s)...`);
    await Promise.all(
      tenants.map((t) =>
        this.tenantDs
          .applyMigrations(t.schemaName)
          .catch((err) =>
            this.logger.error(`Failed to migrate tenant ${t.schemaName}`, err),
          ),
      ),
    );
    this.logger.log('Tenant migrations complete.');
  }

  getHello(): string {
    return 'Hello World!';
  }
}
