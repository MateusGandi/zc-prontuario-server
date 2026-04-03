import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTenantSchema1775232000001 implements MigrationInterface {
  name = 'CreateTenantSchema1775232000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "agendamentos" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "patient_name" VARCHAR(200) NOT NULL,
        "scheduled_at" TIMESTAMPTZ NOT NULL,
        "notes" TEXT,
        "created_by" UUID,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_agendamentos" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "agendamentos"`);
  }
}
