import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { CreateTenantSchema1775232000001 } from '../migrations/tenant/1775232000001-CreateTenantSchema';

dotenv.config();

if (!process.env.TENANT_SCHEMA) {
  throw new Error(
    'Defina TENANT_SCHEMA antes de executar migrações de tenant.\n' +
      'Ex: $env:TENANT_SCHEMA="tenant_abc123"; npm run migration:run:tenant',
  );
}

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432'),
  username: process.env.DB_USER ?? 'admin',
  password: process.env.DB_PASS ?? 'admin_password',
  database: process.env.DB_NAME ?? 'zc_prontuario',
  schema: process.env.TENANT_SCHEMA,
  entities: [],
  migrations: [CreateTenantSchema1775232000001],
  migrationsTableName: 'tenant_migrations',
});
