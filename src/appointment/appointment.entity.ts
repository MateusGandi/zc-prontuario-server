import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'agendamentos' })
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'patient_name', length: 200 })
  patientName: string;

  @Column({ name: 'scheduled_at', type: 'timestamptz' })
  scheduledAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
