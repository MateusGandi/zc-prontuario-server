import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLogs1775232004000 implements MigrationInterface {
  name = 'CreateAuditLogs1775232004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Use DO block to check EXACTLY the current tenant schema,
    // avoiding false positives from public.audit_logs via search_path.
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_tables
          WHERE schemaname = current_schema() AND tablename = 'audit_logs'
        ) THEN
          CREATE TABLE audit_logs (
            id          UUID         NOT NULL DEFAULT gen_random_uuid(),
            table_name  VARCHAR(150) NOT NULL,
            record_id   UUID         NOT NULL,
            action      VARCHAR(50)  NOT NULL,
            old_data    JSONB,
            new_data    JSONB,
            user_id     UUID,
            created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
            CONSTRAINT "PK_audit_logs" PRIMARY KEY (id)
          );

          CREATE INDEX "IDX_audit_logs_table_action"
            ON audit_logs (table_name, action);

          CREATE INDEX "IDX_audit_logs_created_at"
            ON audit_logs (created_at DESC);
        END IF;
      END $$
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS audit_logs`);
  }
}
