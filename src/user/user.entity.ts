import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { Tenant } from '../tenant/tenant.entity';

export enum UserRole {
  ADMIN = 'ADMIN',
  MEDICO = 'MEDICO',
  ATENDENTE = 'ATENDENTE',
}

@Entity('users')
@Index(['tenantId', 'email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.users, { nullable: false })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ length: 150 })
  name: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ length: 150 })
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.ATENDENTE
  })
  role: UserRole;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
