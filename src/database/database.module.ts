import { Module } from '@nestjs/common';
import { TenantDataSourceService } from './tenant-data-source.service';

@Module({
  providers: [TenantDataSourceService],
  exports: [TenantDataSourceService],
})
export class DatabaseModule {}
