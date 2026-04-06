import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { WebhookModule } from '../webhook/webhook.module';
import { PatientController } from './patient.controller';
import { PatientService } from './patient.service';

@Module({
  imports: [DatabaseModule, WebhookModule],
  controllers: [PatientController],
  providers: [PatientService],
})
export class PatientModule {}
