import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateAppointmentDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  patientName!: string;

  @IsDateString()
  scheduledAt!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
