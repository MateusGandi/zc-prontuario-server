import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../auth/auth.guard';
import type { TokenPayload } from '../auth/auth.guard';
import { AppointmentService } from './appointment.service';
import {
  AppointmentRangeQueryDto,
  CreateAppointmentDto,
  RescheduleDto,
  UpdateAppointmentDto,
  UpdateStatusDto,
} from './appointment.dto';
import { AppointmentStatus } from './appointment.entity';

@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Get()
  findAll(
    @CurrentUser() user: TokenPayload,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('professional') professional?: string,
    @Query('status') status?: AppointmentStatus,
    @Query('procedureType') procedureType?: string,
  ) {
    if (start && end) {
      return this.appointmentService.findByRange(
        user.tenantSchema,
        new Date(start),
        new Date(end),
        { professional, status, procedureType },
      );
    }
    return this.appointmentService.findAll(user.tenantSchema);
  }

  @Get('availability')
  getAvailability(
    @CurrentUser() user: TokenPayload,
    @Query('date') date: string,
    @Query('professional') professional?: string,
    @Query('slotMinutes') slotMinutes?: string,
    @Query('startHour') startHour?: string,
    @Query('endHour') endHour?: string,
  ) {
    return this.appointmentService.getAvailability(
      user.tenantSchema,
      date,
      professional,
      slotMinutes ? parseInt(slotMinutes, 10) : 30,
      startHour ? parseInt(startHour, 10) : 8,
      endHour ? parseInt(endHour, 10) : 18,
    );
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: TokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.appointmentService.findById(user.tenantSchema, id);
  }

  @Post()
  create(@CurrentUser() user: TokenPayload, @Body() dto: CreateAppointmentDto) {
    return this.appointmentService.create(user.tenantSchema, user.sub, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: TokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.appointmentService.update(user.tenantSchema, id, user.sub, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: TokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.appointmentService.updateStatus(
      user.tenantSchema,
      id,
      user.sub,
      dto,
    );
  }

  @Patch(':id/reschedule')
  reschedule(
    @CurrentUser() user: TokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RescheduleDto,
  ) {
    return this.appointmentService.reschedule(
      user.tenantSchema,
      id,
      user.sub,
      dto,
    );
  }
}
