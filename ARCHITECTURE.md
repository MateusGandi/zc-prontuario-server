# ZC Prontuário — README Arquitetural

Visão geral da arquitetura, stack técnica, modelo de dados e instruções de setup do sistema **ZC Prontuário**: plataforma multi-tenant para gestão de prontuários médicos e agendamentos.

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Stack Técnica](#2-stack-técnica)
3. [Arquitetura C4 — Nível de Contêiner](#3-arquitetura-c4--nível-de-contêiner)
4. [Modelo de Banco de Dados](#4-modelo-de-banco-de-dados)
5. [Multi-tenancy](#5-multi-tenancy)
6. [Módulos do Backend](#6-módulos-do-backend)
7. [Estrutura do Projeto](#7-estrutura-do-projeto)
8. [Setup Local](#8-setup-local)
9. [Variáveis de Ambiente](#9-variáveis-de-ambiente)
10. [Rodando Migrations](#10-rodando-migrations)
11. [Decisões Técnicas](#11-decisões-técnicas)

---

## 1. Visão Geral

O ZC Prontuário é dividido em dois projetos:

| Projeto                | Tecnologia              | Descrição                           |
| ---------------------- | ----------------------- | ----------------------------------- |
| `zc-prontuario`        | Next.js 15 (App Router) | Frontend — agenda, cadastros, login |
| `zc-prontuario-server` | NestJS 11 + TypeORM 0.3 | Backend API REST                    |

O backend implementa **isolamento por schema PostgreSQL** por tenant (clínica). Cada clínica possui seu próprio schema `pg` com pacientes e agendamentos. Dados centrais (usuários, tenants) ficam no schema `public`.

---

## 2. Stack Técnica

### Backend (`zc-prontuario-server`)

| Camada          | Tecnologia                                       |
| --------------- | ------------------------------------------------ |
| Runtime         | Node.js 20                                       |
| Framework       | NestJS 11                                        |
| Linguagem       | TypeScript 5                                     |
| ORM             | TypeORM 0.3                                      |
| Banco de dados  | PostgreSQL 15                                    |
| Autenticação    | JWT (access token 15 min + refresh token 7 dias) |
| Throttling      | `@nestjs/throttler` v6                           |
| Circuit Breaker | Opossum v8                                       |
| Validação       | `class-validator` + `class-transformer`          |
| Documentação    | Swagger/OpenAPI (`@nestjs/swagger`)              |
| Segurança HTTP  | Helmet                                           |
| Containerização | Docker (multi-stage, Node 20 Alpine)             |

### Frontend (`zc-prontuario`)

| Camada         | Tecnologia                          |
| -------------- | ----------------------------------- |
| Framework      | Next.js 15 (App Router)             |
| Linguagem      | TypeScript 5                        |
| Estilização    | CSS Modules + inline styles         |
| Data fetching  | TanStack Query v5                   |
| Calendário     | React DnD (drag-and-drop), date-fns |
| Componentes UI | Radix UI / shadcn/ui base           |

---

## 3. Arquitetura C4 — Nível de Contêiner

```mermaid
C4Container
    title Diagrama de Contêiner — ZC Prontuário

    Person(user, "Usuário", "Médico, atendente ou admin")

    System_Boundary(zc, "ZC Prontuário") {
        Container(frontend, "Frontend", "Next.js 15", "Interface web da agenda e cadastros")
        Container(api, "Backend API", "NestJS 11", "REST API com autenticação JWT, multi-tenant")
        ContainerDb(db, "PostgreSQL 15", "Database", "Schema 'public' (central) + schemas por tenant")
    }

    System_Ext(webhook_target, "Sistema Externo", "Recebe webhooks de eventos")

    Rel(user, frontend, "Acessa", "HTTPS")
    Rel(frontend, api, "Chama", "HTTP/JSON (REST)")
    Rel(api, db, "Lê/Escreve", "TCP (TypeORM)")
    Rel(api, webhook_target, "Dispara eventos", "HTTPS POST")
```

---

## 4. Modelo de Banco de Dados

### Schema `public` (central)

```
tenants
  id UUID PK
  name VARCHAR(150)
  schema_name VARCHAR(63) UNIQUE   ← nome do schema pg do tenant
  active BOOLEAN
  created_at / updated_at

users
  id UUID PK
  tenantId UUID FK → tenants.id
  name VARCHAR(150)
  email VARCHAR(150) UNIQUE por tenant
  phone VARCHAR(20)
  password VARCHAR (bcrypt)
  role ENUM(ADMIN, MEDICO, ATENDENTE)
  active BOOLEAN
  created_at / updated_at

refresh_tokens
  id UUID PK
  userId UUID FK → users.id
  token VARCHAR UNIQUE
  expires_at TIMESTAMPTZ
  revoked BOOLEAN
  created_at

webhook_subscriptions
  id UUID PK
  url VARCHAR(500)
  events TEXT (simple-array)
  tenant_id UUID NULLABLE
  active BOOLEAN
  secret VARCHAR(100) NULLABLE    ← HMAC-SHA256
  created_at / updated_at

webhook_deliveries
  id UUID PK
  subscription_id UUID FK → webhook_subscriptions.id
  event VARCHAR(100)
  payload JSONB
  status VARCHAR(20)              ← pending | success | failed
  http_status INT NULLABLE
  response_body TEXT NULLABLE
  attempts INT
  next_retry_at TIMESTAMPTZ NULLABLE
  created_at / updated_at
```

### Schema por tenant (ex: `clinica_abc_1abc`)

```
patients
  id UUID PK
  cpf VARCHAR(11) UNIQUE
  name VARCHAR(200)
  birth_date VARCHAR(10)
  phone VARCHAR(20)
  email VARCHAR(150)
  active BOOLEAN
  deleted_at TIMESTAMPTZ NULLABLE  ← soft delete
  created_at / updated_at

appointments
  id UUID PK
  patient_name VARCHAR(200)
  professional VARCHAR(150)
  procedure_type VARCHAR(100)
  status ENUM(AGENDADO, CONFIRMADO, CANCELADO, etc.)
  scheduled_at TIMESTAMPTZ
  end_at TIMESTAMPTZ NULLABLE
  origin VARCHAR(50)
  notes TEXT
  created_by UUID
  created_at / updated_at

audit_logs
  id UUID PK
  entity VARCHAR(100)
  entity_id VARCHAR(100)
  action VARCHAR(20)             ← INSERT | UPDATE | DELETE
  old_data JSONB
  new_data JSONB
  user_id UUID
  created_at
```

---

## 5. Multi-tenancy

O isolamento é feito por schema PostgreSQL:

1. **Criação de tenant** — `POST /tenants` gera um `schemaName` único (slug do nome + timestamp base36), salva na tabela `tenants` do schema `public` e executa automaticamente o migration do schema do tenant via `TenantDataSourceService.applyMigrations(schemaName)`.

2. **Resolução de schema por request** — `TenantDataSourceService` mantém um cache (`Map<schemaName, DataSource>`) de DataSources ativos. Cada request ao contexto de tenant recebe o DataSource correto, que opera com `search_path = tenant_schema`.

3. **Isolamento de dados** — Pacientes e agendamentos de uma clínica são completamente isolados em seu schema. Não há joins cross-schema na aplicação.

---

## 6. Módulos do Backend

| Módulo                 | Responsabilidade                                                  |
| ---------------------- | ----------------------------------------------------------------- |
| `AuthModule`           | Login, logout, refresh token, JWT guard, throttling no controller |
| `TenantModule`         | CRUD de tenants, provisionamento de schema                        |
| `UserModule`           | Entidade User (usada pelo AuthModule)                             |
| `PatientModule`        | CRUD de pacientes por tenant, soft delete                         |
| `AppointmentModule`    | CRUD de agendamentos, status, reescalonamento                     |
| `AuditModule`          | Subscriber TypeORM que grava logs de INSERT/UPDATE/DELETE         |
| `DatabaseModule`       | `TenantDataSourceService` — cache de DataSources por tenant       |
| `CircuitBreakerModule` | `CircuitBreakerService` global usando Opossum                     |
| `WebhookModule`        | Subscriptions, dispatch de eventos, histórico, retry              |

---

## 7. Estrutura do Projeto

```
zc-prontuario-server/
├── Dockerfile
├── docker-compose.yml
└── src/
    ├── main.ts                     ← bootstrap: Helmet, CORS, ValidationPipe, Swagger
    ├── app.module.ts
    ├── auth/
    ├── tenant/
    ├── user/
    ├── patient/
    ├── appointment/
    ├── audit/
    ├── database/
    │   ├── central-data-source.ts  ← CLI migrations (central)
    │   ├── tenant-data-source.ts   ← DataSource factory por tenant
    │   └── tenant-data-source.service.ts
    ├── circuit-breaker/
    ├── webhook/
    └── migrations/
        ├── central/                ← migrations do schema public
        └── tenant/                 ← migrations aplicadas por schema de tenant

zc-prontuario/
└── app/
    ├── layout.tsx
    ├── login/
    ├── cadastro/
    ├── dashboard/
    └── schedule/                   ← página da agenda (week/day/month view)
        ├── page.tsx
        └── schedule.module.css     ← responsivo tablet/mobile
```

---

## 8. Setup Local

### Pré-requisitos

- Node.js ≥ 20
- Docker e Docker Compose

### 1. Subir o banco de dados

```bash
cd zc-prontuario-server
docker compose up -d postgres
```

### 2. Instalar dependências

```bash
# Backend
cd zc-prontuario-server
npm install

# Frontend
cd zc-prontuario
npm install
```

### 3. Configurar variáveis de ambiente

Copie `.env.example` → `.env` em cada projeto (ver seção abaixo).

### 4. Rodar migrations centrais

```bash
cd zc-prontuario-server
npx typeorm migration:run -d src/database/central-data-source.ts
```

### 5. Iniciar em modo dev

```bash
# Backend (porta 3001)
cd zc-prontuario-server
npm run start:dev

# Frontend (porta 3000)
cd zc-prontuario
npm run dev
```

Swagger disponível em: `http://localhost:3001/api/docs`

---

## 9. Variáveis de Ambiente

### `zc-prontuario-server/.env`

| Variável                 | Descrição                    | Exemplo                                                       |
| ------------------------ | ---------------------------- | ------------------------------------------------------------- |
| `DATABASE_URL`           | Connection string PostgreSQL | `postgresql://postgres:postgres@localhost:5432/zc_prontuario` |
| `JWT_SECRET`             | Secret do JWT                | string longa e aleatória                                      |
| `JWT_EXPIRES_IN`         | Validade do access token     | `15m`                                                         |
| `JWT_REFRESH_EXPIRES_IN` | Validade do refresh token    | `7d`                                                          |
| `PORT`                   | Porta HTTP do backend        | `3001`                                                        |
| `CORS_ORIGIN`            | Origin permitida no CORS     | `http://localhost:3000`                                       |

### `zc-prontuario/.env.local`

| Variável              | Descrição       | Exemplo                 |
| --------------------- | --------------- | ----------------------- |
| `NEXT_PUBLIC_API_URL` | URL base da API | `http://localhost:3001` |

---

## 10. Rodando Migrations

### Migrations centrais (schema `public`)

```bash
# Rodar
npx typeorm migration:run -d src/database/central-data-source.ts

# Reverter última
npx typeorm migration:revert -d src/database/central-data-source.ts

# Gerar nova migration
npx typeorm migration:generate src/migrations/central/NomeDaMigration -d src/database/central-data-source.ts
```

### Migrations de tenant

As migrations de tenant são aplicadas automaticamente ao criar um novo tenant via `POST /tenants`. A classe `TenantDataSourceService` chama `applyMigrations(schemaName)` internamente.

---

## 11. Decisões Técnicas

### Por que schema-per-tenant?

Isolamento forte entre clínicas sem necessidade de filtros `WHERE tenant_id = ?` em todas as queries. Row-level security (RLS) do PostgreSQL pode ser adicionado como camada extra futuramente.

### Por que JWT + Refresh Token?

Access tokens de curta duração (15 min) limitam a janela de exposição. Refresh tokens armazenados no banco permitem revogação explícita (logout real).

### Por que Opossum (circuit breaker)?

O dispatch de webhooks chama HTTP externo. Sem circuit breaker, falhas em cascata de endpoints externos poderiam bloquear threads do event loop. O Opossum abre o circuito após 50% de falhas em 5 tentativas e tenta recovery em 30s.

### Por que soft delete em pacientes?

Prontuários médicos têm implicações legais de retenção de dados. Deletar fisicamente registros pode violar regulamentações (LGPD + CFM). O campo `deleted_at` (TypeORM `@DeleteDateColumn`) garante que os dados são preservados mas invisíveis nas queries normais.

### Por que `simple-array` em `webhook_subscriptions.events`?

Simplicidade de implementação. Para volumes maiores ou filtragem eficiente por evento, migrar para `text[]` nativo do PostgreSQL com índice GIN seria o próximo passo.
