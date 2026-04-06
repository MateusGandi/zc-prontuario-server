import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PatientSex {
  MASCULINO = 'masculino',
  FEMININO = 'feminino',
  OUTRO = 'outro',
}

@Entity({ name: 'pacientes' })
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'full_name', length: 200 })
  fullName!: string;

  @Column({ name: 'birth_date', type: 'date' })
  birthDate!: string;

  @Column({ length: 14 })
  cpf!: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  cns!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  sex!: PatientSex | null;

  @Column({ name: 'phone_primary', length: 20 })
  phonePrimary!: string;

  @Column({
    name: 'phone_secondary',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  phoneSecondary!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 9, nullable: true })
  cep!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  street!: string | null;

  @Column({
    name: 'street_number',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  streetNumber!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  neighborhood!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city!: string | null;

  @Column({ type: 'varchar', length: 2, nullable: true })
  uf!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  insurance!: string | null;

  @Column({ name: 'clinical_notes', type: 'text', nullable: true })
  clinicalNotes!: string | null;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
