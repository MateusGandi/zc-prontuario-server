import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus } from './appointment.entity';

export class CreateAppointmentDto {
  @ApiProperty({
    example: 'Maria Souza',
    maxLength: 200,
    description: 'Nome do paciente',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  patientName!: string;

  @ApiPropertyOptional({
    example: 'Dr. João Silva',
    maxLength: 200,
    description: 'Profissional responsável',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  professional?: string;

  @ApiPropertyOptional({
    example: 'Consulta Geral',
    maxLength: 200,
    description: 'Tipo de procedimento',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  procedureType?: string;

  @ApiProperty({
    example: '2026-04-10T09:00:00Z',
    description: 'Data/hora de início (ISO 8601)',
  })
  @IsDateString()
  scheduledAt!: string;

  @ApiPropertyOptional({
    example: '2026-04-10T09:30:00Z',
    description: 'Data/hora de término (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  endAt?: string;

  @ApiPropertyOptional({
    example: 'WhatsApp',
    maxLength: 100,
    description: 'Canal de origem do agendamento',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  origin?: string;

  @ApiPropertyOptional({
    example: 'Paciente com histórico de hipertensão',
    description: 'Observações livres',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAppointmentDto {
  @ApiPropertyOptional({ example: 'Maria Souza', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  patientName?: string;

  @ApiPropertyOptional({ example: 'Dr. João Silva', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  professional?: string;

  @ApiPropertyOptional({ example: 'Consulta Geral', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  procedureType?: string;

  @ApiPropertyOptional({
    example: '2026-04-10T09:00:00Z',
    description: 'ISO 8601',
  })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({
    example: '2026-04-10T09:30:00Z',
    description: 'ISO 8601',
  })
  @IsOptional()
  @IsDateString()
  endAt?: string;

  @ApiPropertyOptional({ example: 'WhatsApp', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  origin?: string;

  @ApiPropertyOptional({ example: 'Paciente com histórico de hipertensão' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateStatusDto {
  @ApiProperty({
    enum: AppointmentStatus,
    example: AppointmentStatus.CONFIRMADO,
    description: 'Novo status do agendamento',
  })
  @IsEnum(AppointmentStatus)
  status!: AppointmentStatus;
}

export class RescheduleDto {
  @ApiProperty({
    example: '2026-04-11T10:00:00Z',
    description: 'Nova data/hora (ISO 8601)',
  })
  @IsDateString()
  scheduledAt!: string;

  @ApiPropertyOptional({
    example: '2026-04-11T10:30:00Z',
    description: 'Novo horário de término (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  endAt?: string;
}

export class AppointmentRangeQueryDto {
  @ApiPropertyOptional({
    example: '2026-04-07T00:00:00Z',
    description: 'Início do intervalo (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  start?: string;

  @ApiPropertyOptional({
    example: '2026-04-13T23:59:59Z',
    description: 'Fim do intervalo (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  end?: string;

  @ApiPropertyOptional({
    example: 'Dr. João Silva',
    description: 'Filtrar por profissional',
  })
  @IsOptional()
  @IsString()
  professional?: string;

  @ApiPropertyOptional({
    enum: AppointmentStatus,
    example: AppointmentStatus.AGENDADO,
    description: 'Filtrar por status',
  })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiPropertyOptional({
    example: 'Consulta Geral',
    description: 'Filtrar por tipo de procedimento',
  })
  @IsOptional()
  @IsString()
  procedureType?: string;
}
