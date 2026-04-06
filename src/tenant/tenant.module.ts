import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './tenant.entity';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant]), DatabaseModule],
  controllers: [TenantController],
  providers: [TenantService],
  exports: [TenantService, TypeOrmModule],
})
export class TenantModule {}
