import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserPhone1775232000002 implements MigrationInterface {
  name = 'AddUserPhone1775232000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "phone" VARCHAR(20)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "phone"`,
    );
  }
}
