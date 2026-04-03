import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

@Entity({ name: 'tenants' })
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  name: string;

  @Column({ name: 'schema_name', length: 63, unique: true })
  schemaName: string;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => User, (user) => user.tenant)
  users: User[];
}
