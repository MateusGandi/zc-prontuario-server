import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './tenant.dto';
import { IsSuperAdmin } from '../auth/auth.guard';

@ApiTags('tenants')
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  /** Lista todos os tenants (super admin) */
  @IsSuperAdmin()
  @ApiOperation({ summary: 'Lista todos os tenants (super admin)' })
  @Get()
  findAll() {
    return this.tenantService.findAllForSuperAdmin();
  }

  /** Cria um novo tenant */
  @IsSuperAdmin()
  @ApiOperation({ summary: 'Cria um novo tenant (super admin)' })
  @Post()
  create(@Body() dto: CreateTenantDto) {
    return this.tenantService.create(dto.name);
  }

  /** Ativa ou inativa um tenant */
  @IsSuperAdmin()
  @ApiOperation({ summary: 'Ativa/inativa tenant (super admin)' })
  @Patch(':id/toggle')
  toggle(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantService.toggleActive(id);
  }
}
