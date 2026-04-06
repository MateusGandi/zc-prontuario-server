import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTenantSchema1775232000001 implements MigrationInterface {
  name = 'CreateTenantSchema1775232000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const schema = (queryRunner.connection.options as any).schema as string;
    const exists = await queryRunner.query(
      `SELECT 1 FROM pg_tables WHERE schemaname = $1 AND tablename = 'agendamentos'`,
      [schema],
    );
    if (exists.length > 0) return;

    await queryRunner.query(`
      CREATE TABLE "${schema}"."agendamentos" (
        "id"           UUID          NOT NULL DEFAULT gen_random_uuid(),
        "patient_name" VARCHAR(200)  NOT NULL,
        "scheduled_at" TIMESTAMPTZ   NOT NULL,
        "notes"        TEXT,
        "created_by"   UUID,
        "created_at"   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        "updated_at"   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_agendamentos_${schema}" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const schema = (queryRunner.connection.options as any).schema as string;
    await queryRunner.query(`DROP TABLE IF EXISTS "${schema}"."agendamentos"`);
  }
}
