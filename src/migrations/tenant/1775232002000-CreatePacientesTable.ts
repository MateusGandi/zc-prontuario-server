import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePacientesTable1775232002000 implements MigrationInterface {
  name = 'CreatePacientesTable1775232002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "pacientes" (
        "id"               UUID          NOT NULL DEFAULT gen_random_uuid(),
        "full_name"        VARCHAR(200)  NOT NULL,
        "birth_date"       DATE          NOT NULL,
        "cpf"              VARCHAR(14)   NOT NULL,
        "cns"              VARCHAR(15),
        "sex"              VARCHAR(20),
        "phone_primary"    VARCHAR(20)   NOT NULL,
        "phone_secondary"  VARCHAR(20),
        "email"            VARCHAR(200),
        "cep"              VARCHAR(9),
        "street"           VARCHAR(200),
        "street_number"    VARCHAR(20),
        "neighborhood"     VARCHAR(100),
        "city"             VARCHAR(100),
        "uf"               VARCHAR(2),
        "insurance"        VARCHAR(200),
        "clinical_notes"   TEXT,
        "is_active"        BOOLEAN       NOT NULL DEFAULT TRUE,
        "deleted_at"       TIMESTAMPTZ,
        "created_by"       UUID,
        "updated_by"       UUID,
        "created_at"       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        "updated_at"       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_pacientes" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_pacientes_cpf" UNIQUE ("cpf")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "pacientes"`);
  }
}
