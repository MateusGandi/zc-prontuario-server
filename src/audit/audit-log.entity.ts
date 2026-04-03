import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  tableName: string;

  @Column('uuid')
  recordId: string;

  @Column({ length: 50 })
  action: string; // INSERT, UPDATE, DELETE

  @Column('jsonb', { nullable: true })
  oldData: any;

  @Column('jsonb', { nullable: true })
  newData: any;

  @Column('uuid', { nullable: true })
  userId: string; // quem mudou

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
