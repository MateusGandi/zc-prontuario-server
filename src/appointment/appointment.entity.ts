import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AppointmentStatus {
  AGENDADO = 'agendado',
  CONFIRMADO = 'confirmado',
  EM_ATENDIMENTO = 'em_atendimento',
  REALIZADO = 'realizado',
  CANCELADO = 'cancelado',
  FALTA = 'falta',
}

@Entity({ name: 'agendamentos' })
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'patient_name', length: 200 })
  patientName: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  professional: string | null;

  @Column({
    name: 'procedure_type',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  procedureType: string | null;

  @Column({ name: 'scheduled_at', type: 'timestamptz' })
  scheduledAt: Date;

  @Column({ name: 'end_at', type: 'timestamptz', nullable: true })
  endAt: Date | null;

  @Column({ type: 'varchar', length: 30, default: AppointmentStatus.AGENDADO })
  status: AppointmentStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  origin: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
