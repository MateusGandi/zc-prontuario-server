import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';

export enum WebhookEvent {
  APPOINTMENT_CREATED = 'appointment.created',
  APPOINTMENT_UPDATED = 'appointment.updated',
  APPOINTMENT_CANCELLED = 'appointment.cancelled',
  PATIENT_CREATED = 'patient.created',
  PATIENT_UPDATED = 'patient.updated',
}

export enum DeliveryStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

@Entity({ name: 'webhook_subscriptions' })
export class WebhookSubscription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 500 })
  url!: string;

  @Column({ type: 'simple-array' })
  events!: WebhookEvent[];

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId!: string | null;

  @Column({ default: true })
  active!: boolean;

  @Column({ name: 'secret', type: 'varchar', length: 100, nullable: true })
  secret!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

@Entity({ name: 'webhook_deliveries' })
export class WebhookDelivery {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => WebhookSubscription, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscription_id' })
  subscription!: WebhookSubscription;

  @Column({ name: 'subscription_id', type: 'uuid' })
  subscriptionId!: string;

  @Column({ name: 'event', type: 'varchar', length: 100 })
  event!: string;

  @Column({ type: 'jsonb' })
  payload!: object;

  @Column({ type: 'varchar', default: DeliveryStatus.PENDING })
  status!: DeliveryStatus;

  @Column({ name: 'http_status', type: 'int', nullable: true })
  httpStatus!: number | null;

  @Column({ name: 'response_body', type: 'text', nullable: true })
  responseBody!: string | null;

  @Column({ name: 'attempts', type: 'int', default: 0 })
  attempts!: number;

  @Column({ name: 'next_retry_at', type: 'timestamptz', nullable: true })
  nextRetryAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
