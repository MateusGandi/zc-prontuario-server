import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { WebhookModule } from '../webhook/webhook.module';
import { AuditModule } from '../audit/audit.module';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';

@Module({
  imports: [DatabaseModule, WebhookModule, AuditModule],
  controllers: [AppointmentController],
  providers: [AppointmentService],
})
export class AppointmentModule {}
