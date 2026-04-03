import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/auth.guard';
import type { TokenPayload } from '../auth/auth.guard';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './appointment.dto';

@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Get()
  findAll(@CurrentUser() user: TokenPayload) {
    return this.appointmentService.findAll(user.tenantSchema);
  }

  @Post()
  create(@CurrentUser() user: TokenPayload, @Body() dto: CreateAppointmentDto) {
    return this.appointmentService.create(user.tenantSchema, user.sub, dto);
  }
}
