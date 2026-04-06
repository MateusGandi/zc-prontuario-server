import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { Appointment } from '../appointment/appointment.entity';
import { Patient } from '../patient/patient.entity';
import { CreateTenantSchema1775232000001 } from '../migrations/tenant/1775232000001-CreateTenantSchema';
import { AddAppointmentFields1775232001000 } from '../migrations/tenant/1775232001000-AddAppointmentFields';
import { CreatePacientesTable1775232002000 } from '../migrations/tenant/1775232002000-CreatePacientesTable';
import { CreateAuditLogs1775232004000 } from '../migrations/tenant/1775232004000-CreateAuditLogs';

@Injectable()
export class TenantDataSourceService implements OnModuleDestroy {
  private readonly cache = new Map<string, DataSource>();
  private readonly logger = new Logger(TenantDataSourceService.name);

  constructor(private readonly config: ConfigService) {}

  async getDataSource(tenantSchema: string): Promise<DataSource> {
    if (this.cache.has(tenantSchema)) {
      const ds = this.cache.get(tenantSchema)!;
      if (!ds.isInitialized) await ds.initialize();
      return ds;
    }

    const ds = new DataSource({
      type: 'postgres',
      host: this.config.get<string>('DB_HOST', 'localhost'),
      port: this.config.get<number>('DB_PORT', 5432),
      username: this.config.get<string>('DB_USER', 'admin'),
      password: this.config.get<string>('DB_PASS', 'admin_password'),
      database: this.config.get<string>('DB_NAME', 'zc_prontuario'),
      schema: tenantSchema,
      entities: [Appointment, Patient],
      migrations: [
        CreateTenantSchema1775232000001,
        AddAppointmentFields1775232001000,
        CreatePacientesTable1775232002000,
        CreateAuditLogs1775232004000,
      ],
      migrationsTableName: 'tenant_migrations',
    });

    await ds.initialize();

    try {
      const ran = await ds.runMigrations({ transaction: 'each' });
      if (ran.length > 0) {
        this.logger.log(
          `[${tenantSchema}] Applied ${ran.length} migration(s): ${ran.map((m) => m.name).join(', ')}`,
        );
      } else {
        this.logger.log(`[${tenantSchema}] No pending migrations.`);
      }
    } catch (err) {
      this.logger.error(`[${tenantSchema}] Migration failed`, err);
      await ds.destroy();
      throw err;
    }

    // Repair: ensure all tables exist regardless of migration record state
    await this.ensureAgendamentosTable(ds, tenantSchema);
    await this.ensurePacientesTable(ds, tenantSchema);
    await this.ensureAuditLogsTable(ds, tenantSchema);

    this.cache.set(tenantSchema, ds);
    return ds;
  }

  /**
   * Idempotent DDL repair — creates agendamentos if absent in the tenant schema.
   * Covers all fields from both CreateTenantSchema and AddAppointmentFields migrations.
   */
  private async ensureAgendamentosTable(
    ds: DataSource,
    tenantSchema: string,
  ): Promise<void> {
    const [row] = await ds.query<{ exists: boolean }[]>(
      `SELECT EXISTS (
         SELECT 1 FROM pg_tables
         WHERE schemaname = $1 AND tablename = 'agendamentos'
       ) AS "exists"`,
      [tenantSchema],
    );

    if (String(row?.exists) === 'true') {
      return;
    }

    this.logger.warn(
      `[${tenantSchema}] agendamentos table missing — running DDL repair`,
    );
    await ds.query(`
      CREATE TABLE "${tenantSchema}"."agendamentos" (
        "id"             UUID          NOT NULL DEFAULT gen_random_uuid(),
        "patient_name"   VARCHAR(200)  NOT NULL,
        "professional"   VARCHAR(200),
        "procedure_type" VARCHAR(200),
        "scheduled_at"   TIMESTAMPTZ   NOT NULL,
        "end_at"         TIMESTAMPTZ,
        "status"         VARCHAR(30)   NOT NULL DEFAULT 'agendado',
        "origin"         VARCHAR(100),
        "notes"          TEXT,
        "created_by"     UUID,
        "updated_by"     UUID,
        "created_at"     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        "updated_at"     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_agendamentos_${tenantSchema}" PRIMARY KEY ("id")
      )
    `);
    this.logger.log(`[${tenantSchema}] agendamentos DDL repair complete.`);
  }

  /**
   * Idempotent DDL repair — creates pacientes if absent (handles desync between
   * tenant_migrations table and actual schema, e.g. after a partial failure).
   * Uses fully-qualified schema.table names to avoid search_path issues.
   */
  private async ensurePacientesTable(
    ds: DataSource,
    tenantSchema: string,
  ): Promise<void> {
    const [row] = await ds.query<{ exists: boolean }[]>(
      `SELECT EXISTS (
         SELECT 1 FROM pg_tables
         WHERE schemaname = $1 AND tablename = 'pacientes'
       ) AS "exists"`,
      [tenantSchema],
    );

    const tableExists = String(row?.exists) === 'true';

    if (tableExists) {
      this.logger.log(`[${tenantSchema}] pacientes table already exists.`);
      return;
    }

    this.logger.warn(
      `[${tenantSchema}] pacientes table missing — running DDL repair`,
    );
    // Use explicitly qualified schema to avoid search_path dependency
    await ds.query(`
      CREATE TABLE IF NOT EXISTS "${tenantSchema}"."pacientes" (
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
        CONSTRAINT "PK_pacientes_${tenantSchema}" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_pacientes_cpf_${tenantSchema}" UNIQUE ("cpf")
      )
    `);
    this.logger.log(`[${tenantSchema}] DDL repair complete.`);
  }

  private async ensureAuditLogsTable(
    ds: DataSource,
    tenantSchema: string,
  ): Promise<void> {
    const [row] = await ds.query<{ exists: boolean }[]>(
      `SELECT EXISTS (
         SELECT 1 FROM pg_tables
         WHERE schemaname = $1 AND tablename = 'audit_logs'
       ) AS "exists"`,
      [tenantSchema],
    );

    if (String(row?.exists) === 'true') {
      return;
    }

    this.logger.warn(`[${tenantSchema}] audit_logs missing — creating`);
    await ds.query(`
      CREATE TABLE "${tenantSchema}"."audit_logs" (
        id          UUID         NOT NULL DEFAULT gen_random_uuid(),
        table_name  VARCHAR(150) NOT NULL,
        record_id   UUID         NOT NULL,
        action      VARCHAR(50)  NOT NULL,
        old_data    JSONB,
        new_data    JSONB,
        user_id     UUID,
        created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_audit_logs_${tenantSchema}" PRIMARY KEY (id)
      )
    `);
    await ds.query(
      `CREATE INDEX "IDX_audit_logs_tbl_${tenantSchema}"
       ON "${tenantSchema}"."audit_logs" (table_name, action)`,
    );
    this.logger.log(`[${tenantSchema}] audit_logs created.`);
  }

  /**
   * Cria o schema PostgreSQL e aplica as migrations do tenant.
   * Chamado automaticamente ao registrar um novo tenant.
   */
  async applyMigrations(tenantSchema: string): Promise<void> {
    // getDataSource já aplica migrations ao inicializar a conexão
    await this.getDataSource(tenantSchema);
  }

  async onModuleDestroy(): Promise<void> {
    const closes = [...this.cache.values()]
      .filter((ds) => ds.isInitialized)
      .map((ds) => ds.destroy());
    await Promise.all(closes);
  }
}
