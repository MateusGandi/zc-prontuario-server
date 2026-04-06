import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCentralSchema1775232000000 implements MigrationInterface {
  name = 'CreateCentralSchema1775232000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Tenants
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tenants" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "name" VARCHAR(150) NOT NULL,
        "schema_name" VARCHAR(63) NOT NULL,
        "active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_tenants" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_tenants_schema_name" UNIQUE ("schema_name")
      )
    `);

    // User role enum
    await queryRunner.query(
      `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
          CREATE TYPE "public"."user_role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MEDICO', 'ATENDENTE');
        END IF;
      END $$`,
    );

    // Users
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "tenantId" UUID NOT NULL,
        "name" VARCHAR(150) NOT NULL,
        "phone" VARCHAR(20),
        "email" VARCHAR(150) NOT NULL,
        "password" VARCHAR NOT NULL,
        "role" "public"."user_role" NOT NULL DEFAULT 'ATENDENTE',
        "active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_tenant_email" UNIQUE ("tenantId", "email"),
        CONSTRAINT "FK_users_tenant" FOREIGN KEY ("tenantId")
          REFERENCES "tenants"("id") ON DELETE RESTRICT
      )
    `);

    // Audit logs (schema central)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "tableName" VARCHAR(150) NOT NULL,
        "recordId" UUID NOT NULL,
        "action" VARCHAR(50) NOT NULL,
        "oldData" JSONB,
        "newData" JSONB,
        "userId" UUID,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."user_role"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tenants"`);
  }
}
