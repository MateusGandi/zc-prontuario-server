import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLogs1775232004000 implements MigrationInterface {
  name = 'CreateAuditLogs1775232004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const schema = (queryRunner.connection.options as any).schema as string;
    const exists = await queryRunner.query(
      `SELECT 1 FROM pg_tables WHERE schemaname = $1 AND tablename = 'audit_logs'`,
      [schema],
    );
    if (exists.length > 0) return;

    await queryRunner.query(`
      CREATE TABLE "${schema}"."audit_logs" (
        id          UUID         NOT NULL DEFAULT gen_random_uuid(),
        table_name  VARCHAR(150) NOT NULL,
        record_id   UUID         NOT NULL,
        action      VARCHAR(50)  NOT NULL,
        old_data    JSONB,
        new_data    JSONB,
        user_id     UUID,
        created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_audit_logs_${schema}" PRIMARY KEY (id)
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_tbl_act_${schema}" ON "${schema}"."audit_logs" (table_name, action)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_cat_${schema}" ON "${schema}"."audit_logs" (created_at DESC)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const schema = (queryRunner.connection.options as any).schema as string;
    await queryRunner.query(`DROP TABLE IF EXISTS "${schema}"."audit_logs"`);
  }
}
