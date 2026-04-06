import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWebhookTables1775232003000 implements MigrationInterface {
  name = 'CreateWebhookTables1775232003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "webhook_subscriptions" (
        "id"          UUID         NOT NULL DEFAULT gen_random_uuid(),
        "url"         VARCHAR(500) NOT NULL,
        "events"      TEXT         NOT NULL,
        "tenant_id"   UUID,
        "active"      BOOLEAN      NOT NULL DEFAULT TRUE,
        "secret"      VARCHAR(100),
        "created_at"  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        "updated_at"  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_webhook_subscriptions" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "webhook_deliveries" (
        "id"              UUID         NOT NULL DEFAULT gen_random_uuid(),
        "subscription_id" UUID         NOT NULL,
        "event"           VARCHAR(100) NOT NULL,
        "payload"         JSONB        NOT NULL,
        "status"          VARCHAR(20)  NOT NULL DEFAULT 'pending',
        "http_status"     INT,
        "response_body"   TEXT,
        "attempts"        INT          NOT NULL DEFAULT 0,
        "next_retry_at"   TIMESTAMPTZ,
        "created_at"      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        "updated_at"      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_webhook_deliveries" PRIMARY KEY ("id"),
        CONSTRAINT "FK_delivery_subscription"
          FOREIGN KEY ("subscription_id")
          REFERENCES "webhook_subscriptions"("id")
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_deliveries_subscription"
       ON "webhook_deliveries" ("subscription_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "webhook_deliveries"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "webhook_subscriptions"`);
  }
}
