import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AppointmentController],
  providers: [AppointmentService],
})
export class AppointmentModule {}
