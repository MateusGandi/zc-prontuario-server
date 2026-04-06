import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../auth/auth.guard';
import type { TokenPayload } from '../auth/auth.guard';
import { PatientService } from './patient.service';
import {
  CreatePatientDto,
  PatientQueryDto,
  UpdatePatientDto,
} from './patient.dto';

@Controller('patients')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Get()
  findAll(@CurrentUser() user: TokenPayload, @Query() query: PatientQueryDto) {
    return this.patientService.findAll(user.tenantSchema, query);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: TokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.patientService.findById(user.tenantSchema, id);
  }

  @Post()
  create(@CurrentUser() user: TokenPayload, @Body() dto: CreatePatientDto) {
    return this.patientService.create(user.tenantSchema, user.sub, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: TokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePatientDto,
  ) {
    return this.patientService.update(user.tenantSchema, user.sub, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(
    @CurrentUser() user: TokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.patientService.softDelete(user.tenantSchema, user.sub, id);
  }
}
