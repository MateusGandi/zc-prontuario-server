import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { CreateCentralSchema1775232000000 } from '../migrations/central/1775232000000-CreateCentralSchema';

dotenv.config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432'),
  username: process.env.DB_USER ?? 'admin',
  password: process.env.DB_PASS ?? 'admin_password',
  database: process.env.DB_NAME ?? 'zc_prontuario',
  schema: 'public',
  entities: [],
  migrations: [CreateCentralSchema1775232000000],
  migrationsTableName: 'central_migrations',
});
