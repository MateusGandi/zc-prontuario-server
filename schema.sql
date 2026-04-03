-- ============================================================
-- ZC Prontuário — Schema Central (public)
-- Execute este script UMA VEZ no banco para criar as tabelas
-- centrais. As migrations fazem o mesmo, mas este arquivo é
-- útil para setup manual ou consulta rápida.
-- ============================================================

-- ── Tenants ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "tenants" (
  "id"          UUID         NOT NULL DEFAULT gen_random_uuid(),
  "name"        VARCHAR(150) NOT NULL,
  "schema_name" VARCHAR(63)  NOT NULL,
  "active"      BOOLEAN      NOT NULL DEFAULT true,
  "created_at"  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updated_at"  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT "PK_tenants"             PRIMARY KEY ("id"),
  CONSTRAINT "UQ_tenants_schema_name" UNIQUE ("schema_name")
);

-- ── Enum de roles ─────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "public"."user_role" AS ENUM ('ADMIN', 'MEDICO', 'ATENDENTE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Usuários ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "users" (
  "id"         UUID                   NOT NULL DEFAULT gen_random_uuid(),
  "tenantId"   UUID                   NOT NULL,
  "name"       VARCHAR(150)           NOT NULL,
  "phone"      VARCHAR(20),
  "email"      VARCHAR(150)           NOT NULL,
  "password"   VARCHAR                NOT NULL,
  "role"       "public"."user_role"   NOT NULL DEFAULT 'ATENDENTE',
  "active"     BOOLEAN                NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ            NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ            NOT NULL DEFAULT NOW(),
  CONSTRAINT "PK_users"              PRIMARY KEY ("id"),
  CONSTRAINT "UQ_users_tenant_email" UNIQUE ("tenantId", "email"),
  CONSTRAINT "FK_users_tenant"       FOREIGN KEY ("tenantId")
    REFERENCES "tenants"("id") ON DELETE RESTRICT
);

-- ── Audit logs ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id"          UUID         NOT NULL DEFAULT gen_random_uuid(),
  "tableName"   VARCHAR(150) NOT NULL,
  "recordId"    UUID         NOT NULL,
  "action"      VARCHAR(50)  NOT NULL,
  "oldData"     JSONB,
  "newData"     JSONB,
  "userId"      UUID,
  "created_at"  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
);

-- ============================================================
-- Schema por tenant
-- Para cada novo tenant criado via POST /auth/register, o
-- sistema cria automaticamente o schema e aplica as migrations.
-- Caso precise criar manualmente:
--
--   CREATE SCHEMA IF NOT EXISTS "tenant_<uuid_sem_traccos>";
--
--   SET search_path TO "tenant_<uuid_sem_traccos>";
--
--   CREATE TABLE IF NOT EXISTS "agendamentos" (
--     "id"           UUID         NOT NULL DEFAULT gen_random_uuid(),
--     "patient_name" VARCHAR(200) NOT NULL,
--     "scheduled_at" TIMESTAMPTZ  NOT NULL,
--     "notes"        TEXT,
--     "created_by"   UUID,
--     "created_at"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
--     "updated_at"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
--     CONSTRAINT "PK_agendamentos" PRIMARY KEY ("id")
--   );
--
--   RESET search_path;
-- ============================================================
