import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAppointmentFields1775232001000 implements MigrationInterface {
  name = 'AddAppointmentFields1775232001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const schema = (queryRunner.connection.options as any).schema as string;
    await queryRunner.query(`
      ALTER TABLE "${schema}"."agendamentos"
        ADD COLUMN IF NOT EXISTS "professional"    VARCHAR(200),
        ADD COLUMN IF NOT EXISTS "procedure_type"  VARCHAR(200),
        ADD COLUMN IF NOT EXISTS "end_at"          TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS "status"          VARCHAR(30) NOT NULL DEFAULT 'agendado',
        ADD COLUMN IF NOT EXISTS "origin"          VARCHAR(100),
        ADD COLUMN IF NOT EXISTS "updated_by"      UUID
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const schema = (queryRunner.connection.options as any).schema as string;
    await queryRunner.query(`
      ALTER TABLE "${schema}"."agendamentos"
        DROP COLUMN IF EXISTS "professional",
        DROP COLUMN IF EXISTS "procedure_type",
        DROP COLUMN IF EXISTS "end_at",
        DROP COLUMN IF EXISTS "status",
        DROP COLUMN IF EXISTS "origin",
        DROP COLUMN IF EXISTS "updated_by"
    `);
  }
}
