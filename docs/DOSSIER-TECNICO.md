# NeXFlowX — Dossier Técnico Completo

**Versão:** 2.4.1-beta  
**Data:** Dezembro 2024  
**Autor:** NeXTrustX Engineering  
**Classificação:** Interno — Confidencial

---

## 1. Visão Geral do Projeto

### 1.1 O que é o NeXFlowX?

Plataforma B2B2C de **orquestração financeira** que permite a donos de negócios digitais monitorar, rotear e gerir fluxos de carga financeira across-border em tempo real. Funciona como uma **Torre de Controle de Supply Chain Financeira**.

### 1.2 Público-Alvo

Donos de negócios digitais que operam em múltiplos mercados europeus e necessitam de visibilidade centralizada sobre:
- Disponibilidade de métodos de pagamento por país
- Capacidade e limites diários por trilho
- Fluxo de transações em pipeline
- Gestão de API Keys e webhooks
- Geração de links de pagamento

### 1.3 Escopo Atual (Beta)

| Dimensão | Valor |
|----------|-------|
| Países cobertos | 11 (PT, ES, FR, NL, BE, AT, PL, UK, CH, DE, IT) |
| Métodos de pagamento | 72 trilhos mapeados |
| Providers ativos | Stripe (primário) |
| Status de dados | **MOCK** — estruturado para API real |
| Autenticação | Hardcoded (beta) |

---

## 2. Arquitetura Técnica

### 2.1 Stack Tecnológico

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│  Next.js 16 · App Router · TypeScript 5             │
│  Tailwind CSS 4 · shadcn/ui · Lucide React          │
│  Zustand (state) · TanStack Query (server state)    │
│  Framer Motion · Canvas API (animações)             │
├─────────────────────────────────────────────────────┤
│                   NEXT.JS API                        │
│  /api/v1/* (Route Handlers)                          │
├─────────────────────────────────────────────────────┤
│                   BACKEND (futuro)                    │
│  REST API · JWT Auth · PostgreSQL / MySQL           │
│  Stripe API · Webhook delivery · Provider routing   │
├─────────────────────────────────────────────────────┤
│                    INFRA                             │
│  Vercel (Edge) · Vercel Postgres                    │
│  Redis (cache) · Upstash (rate limiting)             │
└─────────────────────────────────────────────────────┘
```

### 2.2 Estrutura de Ficheiros

```
src/
├── app/
│   ├── page.tsx                    # Auth gate → LoginPage or DashboardShell
│   ├── layout.tsx                 # Root layout (dark theme, fonts)
│   ├── globals.css                # Cyberpunk theme system
│   └── api/                       # Next.js API routes (stub)
│       └── route.ts
├── components/
│   ├── dashboard/
│   │   ├── sidebar.tsx            # Navigation + country/rail counts
│   │   ├── header.tsx             # Top bar (search, clock, notifications)
│   │   ├── dashboard-shell.tsx    # Main layout wrapper + footer
│   │   ├── dashboard-overview.tsx # KPIs + activity feed + highlights
│   │   ├── capacity-matrix.tsx    # Country filter + rail grid
│   │   ├── logistic-pipeline.tsx  # 3-stage funnel + conversion rates
│   │   ├── transactions-table.tsx # Searchable transaction history
│   │   ├── payment-link-generator.tsx # Amount + country → Stripe URL
│   │   └── api-management.tsx     # Keys CRUD + webhook config
│   ├── login-page.tsx             # Auth form + canvas animation
│   └── ui/                        # shadcn/ui component library
├── lib/
│   ├── api/
│   │   ├── contracts.ts           # ALL TypeScript types for API
│   │   └── client.ts              # Fetch wrapper (production-ready)
│   ├── mock-system-state.ts       # Current mock data (72 entries)
│   ├── auth-store.ts              # Zustand + persist auth state
│   ├── dashboard-store.ts         # Zustand UI navigation state
│   ├── db.ts                      # Prisma client
│   └── utils.ts                   # cn() utility
├── hooks/                         # React hooks (use-toast, use-mobile)
prisma/
│   └── schema.prisma              # Database schema (to be updated)
```

### 2.3 Design System

| Token | Valor | Uso |
|-------|-------|-----|
| Background | `#0A0A0C` | Fundo principal |
| Foreground | `#E0E0E8` | Texto principal |
| Neon Green | `#00FF41` | Estados ativos, AVAILABLE |
| Neon Red | `#FF0040` | Alertas, CRITICAL |
| Neon Orange | `#FF8C00` | Estados limitados, LIMITED |
| Neon Yellow | `#FFD600` | Integração em progresso |
| Neon Cyan | `#00F0FF` | SLA, info badges, LOCAL rails |
| Panel BG | `rgba(15,15,20,0.7)` + blur | Glassmorphism |
| Panel Border | `rgba(51,51,51,0.6)` | Fine borders |
| Font Mono | Geist Mono | Dados técnicos |
| Font Sans | Geist Sans | UI text |

---

## 3. Rotas API — Contrato Completo

### Base URL: `/api/v1`

Todas as rotas retornam JSON. Autenticação via `Authorization: Bearer <jwt>`.

---

### 3.1 Autenticação

#### `POST /api/v1/auth/login`

Autenticação de utilizador.

**Request:**
```json
{
  "username": "NeXFlowX",
  "password": "Nex123456789*"
}
```

**Response 200:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "rt_abc123...",
  "expires_in": 86400,
  "user": {
    "id": "usr_001",
    "username": "NeXFlowX",
    "email": "admin@nexflowx.io",
    "role": "admin",
    "organization_id": "org_001",
    "created_at": "2024-01-15T10:00:00Z",
    "last_login": "2024-12-15T14:30:00Z"
  }
}
```

**Response 401:**
```json
{
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Credenciais inválidas. Acesso não autorizado."
  }
}
```

**Migração necessária no frontend:**
- `src/lib/auth-store.ts` → substituir hardcoded check por `api.auth.login()`
- Guardar token em `localStorage` (já implementado no client.ts)
- Validar token no `AuthMeResponse`

---

#### `GET /api/v1/auth/me`

Validar sessão atual.

**Response 200:**
```json
{
  "user": { /* AuthUser */ },
  "permissions": ["payments:read", "payments:write", "api_keys:manage", "webhooks:manage"],
  "two_factor_enabled": false
}
```

---

#### `POST /api/v1/auth/logout`

Invalidar token.

---

### 3.2 System State

#### `GET /api/v1/system-state`

Retorna todos os métodos de pagamento e sua disponibilidade. **Rota central do sistema.**

**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| `country_code` | string | Filtrar por país (ex: `PT`) |

**Response 200:**
```json
{
  "data": [
    {
      "id": "ss_001",
      "country_code": "PT",
      "payment_method": "MBWay",
      "availability_status": "LIMITED",
      "provider_name": "Stripe",
      "priority": 1,
      "fee_percent": 2.9,
      "fee_fixed": 0.3,
      "sla_hours": 24,
      "max_volume_daily": null,
      "used_volume_daily": null,
      "remaining_volume": null,
      "capacity_status": "UNLIMITED",
      "notes": "Via Stripe (não direto)",
      "is_local": true,
      "enabled": true,
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-12-15T14:00:00Z"
    }
  ],
  "meta": {
    "total_entries": 72,
    "countries": 11,
    "available": 68,
    "limited": 2,
    "critical": 1,
    "integrating": 1,
    "local_rails": 12,
    "last_updated": "2024-12-15T14:30:00Z"
  }
}
```

**Regras de frontend (implementadas):**
- `capacity_status === "UNLIMITED"` → display `∞`
- `provider_name === null` → display `N/A`
- `availability_status` → cores: AVAILABLE=#00FF41, LIMITED=#FF8C00, CRITICAL=#FF0040, INTEGRATION_IN_PROGRESS=#FFD600

**Migração:**
- `src/lib/mock-system-state.ts` → eliminar `systemStateMock` array
- Substituir por `api.systemState.list(countryCode)` em todos os componentes
- `countryMeta` permanece como config estático no frontend

---

### 3.3 Dashboard Stats

#### `GET /api/v1/dashboard/stats?period=24h`

**Response 200:**
```json
{
  "data": {
    "period": "24h",
    "volume_total": 2847392.50,
    "volume_currency": "EUR",
    "transactions_count": 14729,
    "transactions_success_rate": 98.73,
    "alerts_active": 3,
    "alerts_critical": 1,
    "markets_active": 11,
    "rails_operational": 68,
    "rails_total": 72,
    "throughput_per_hour": 198000,
    "avg_settlement_hours": 18.5
  },
  "previous_period": { /* same shape, period=24h offset */ },
  "trend": {
    "volume_change_percent": 12.4,
    "success_rate_change_percent": 0.12
  }
}
```

**Migração:** `dashboard-overview.tsx` stats grid → `api.dashboard.stats()`

---

### 3.4 Transações

#### `GET /api/v1/transactions?page=1&limit=25&country_code=PT&status=completed&search=MBWay`

**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Página (default: 1) |
| `limit` | number | Items por página (default: 25) |
| `country_code` | string | Filtrar por país |
| `status` | string | `completed`, `pending`, `processing`, `failed` |
| `type` | string | `payment`, `settlement`, `conversion`, `refund` |
| `search` | string | Busca por ID, nome, trilho |
| `sort` | string | Campo de ordenação |
| `order` | string | `asc` ou `desc` |

**Response 200:**
```json
{
  "data": [
    {
      "id": "TXN-8F4K2M",
      "external_id": "pi_3abc123...",
      "type": "payment",
      "status": "completed",
      "amount": 450.00,
      "amount_refunded": null,
      "currency": "EUR",
      "country_code": "PT",
      "payment_method": "MBWay",
      "provider_name": "Stripe",
      "payer_name": "João Silva",
      "payer_email": "joao@email.com",
      "payee_id": "usr_001",
      "metadata": null,
      "error_code": null,
      "error_message": null,
      "settled_at": "2024-12-15T15:00:00Z",
      "created_at": "2024-12-15T14:32:08Z",
      "updated_at": "2024-12-15T15:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 1247,
    "total_pages": 50
  },
  "summary": {
    "total_volume": 52741.49,
    "success_rate": 94.2,
    "by_status": {
      "completed": 1175,
      "pending": 42,
      "processing": 18,
      "failed": 12
    },
    "by_type": {
      "payment": 890,
      "settlement": 210,
      "conversion": 95,
      "refund": 52
    }
  }
}
```

**Migração:** `transactions-table.tsx` → `api.transactions.list(query)`

---

#### `GET /api/v1/transactions/:id`

Inclui timeline de eventos da transação.

---

### 3.5 Pipeline Logístico

#### `GET /api/v1/pipeline`

**Response 200:**
```json
{
  "stages": [
    {
      "id": "gateway",
      "label": "Em Trânsito",
      "sublabel": "Gateway de Entrada",
      "volume": 847392.00,
      "volume_currency": "EUR",
      "count": 3241,
      "percentage_of_total": 100,
      "avg_duration_hours": null
    },
    {
      "id": "fiat",
      "label": "Liquidez Garantida",
      "sublabel": "Fiat (EUR/BRL)",
      "volume": 1623000.00,
      "volume_currency": "EUR",
      "count": 8947,
      "percentage_of_total": 75,
      "avg_duration_hours": 4.2
    },
    {
      "id": "delivery",
      "label": "Processando Entrega",
      "sublabel": "USDT / PIX",
      "volume": 377000.00,
      "volume_currency": "EUR",
      "count": 2541,
      "percentage_of_total": 45,
      "avg_duration_hours": 8.7
    }
  ],
  "total_volume": 2847392.00,
  "total_volume_currency": "EUR",
  "throughput_per_hour": 198000,
  "conversion_rates": [
    { "pair": "EUR_USDT", "rate": 1.0847, "status": "active", "last_updated": "..." },
    { "pair": "EUR_BRL", "rate": 5.3421, "status": "active", "last_updated": "..." },
    { "pair": "USDT_BRL", "rate": 4.9230, "status": "active", "last_updated": "..." }
  ]
}
```

**Migração:** `logistic-pipeline.tsx` → `api.pipeline.get()`

---

### 3.6 Payment Links

#### `POST /api/v1/payment-links`

**Request:**
```json
{
  "amount": 250.00,
  "currency": "EUR",
  "country_code": "PT",
  "payment_method": null,
  "description": "Order #12345",
  "metadata": { "order_id": "12345" },
  "expires_at": "2024-12-22T14:00:00Z"
}
```

**Response 201:**
```json
{
  "data": {
    "id": "pl_abc123",
    "url": "https://pay.nexflowx.io/PT/pay?id=abc123&amount=250",
    "short_code": "NXF-A8K2M9",
    "amount": 250.00,
    "currency": "EUR",
    "country_code": "PT",
    "payment_method": "MBWay",
    "status": "active",
    "payer_name": null,
    "paid_at": null,
    "expires_at": "2024-12-22T14:00:00Z",
    "created_at": "2024-12-15T14:32:00Z",
    "checkout_url": "https://buy.stripe.com/cNi4gzdSq7Zkflo2QX1B607"
  }
}
```

#### `GET /api/v1/payment-links?page=1&limit=25`

**Migração:** `payment-link-generator.tsx` → `api.paymentLinks.create(data)`

---

### 3.7 API Keys

#### `GET /api/v1/api-keys`

**Response 200:**
```json
{
  "data": [
    {
      "id": "key-001",
      "name": "Production API",
      "key_prefix": "nxf_live_sk_a8f2",
      "environment": "production",
      "status": "active",
      "last_used_at": "2024-12-15T14:30:00Z",
      "last_ips": ["203.0.113.42", "198.51.100.17"],
      "created_at": "2024-11-15T10:00:00Z",
      "revoked_at": null
    }
  ]
}
```

⚠️ **NUNCA retornar `key_full` na listagem.** Apenas no POST de criação.

#### `POST /api/v1/api-keys`

**Request:**
```json
{
  "name": "Production API v2",
  "environment": "production",
  "permissions": ["payments:read", "payments:write", "refunds:write"]
}
```

**Response 201:**
```json
{
  "data": {
    "id": "key-004",
    "name": "Production API v2",
    "key_prefix": "nxf_live_sk_x7k3",
    "key_full": "nxf_live_sk_x7k3m9p2q1r5t8v0w4y6z",
    "environment": "production",
    "status": "active",
    "last_used_at": null,
    "last_ips": [],
    "created_at": "2024-12-15T14:30:00Z",
    "revoked_at": null
  },
  "warning": "Store this key now. You won't see it again."
}
```

#### `DELETE /api/v1/api-keys/:id`

Revoga uma API key. Response 204 No Content.

**Migração:** `api-management.tsx` → `api.apiKeys.list()`, `.create()`, `.revoke()`

---

### 3.8 Webhooks

#### `GET /api/v1/webhooks`

**Response 200:**
```json
{
  "data": {
    "url": "https://api.mybusiness.com/webhooks/nexflowx",
    "secret": "whsec_abc123...",
    "events": [
      { "name": "payment.received", "description": "Pagamento recebido com sucesso", "enabled": true },
      { "name": "payment.failed", "description": "Falha no processamento", "enabled": true },
      { "name": "settlement.completed", "description": "Liquidação concluída", "enabled": true },
      { "name": "capacity.warning", "description": "Alerta de capacidade", "enabled": false },
      { "name": "webhook.delivery_failed", "description": "Falha na entrega", "enabled": false }
    ],
    "last_delivery_status": 200,
    "last_delivery_at": "2024-12-15T14:28:00Z",
    "deliveries_24h": 1247,
    "deliveries_failed_24h": 2,
    "success_rate_24h": 99.84,
    "created_at": "2024-11-15T10:00:00Z",
    "updated_at": "2024-12-15T14:00:00Z"
  }
}
```

#### `PUT /api/v1/webhooks`

**Request:**
```json
{
  "url": "https://api.mybusiness.com/webhooks/nexflowx",
  "events": [
    { "name": "payment.received", "enabled": true },
    { "name": "capacity.warning", "enabled": true }
  ]
}
```

**Migração:** `api-management.tsx` webhook section → `api.webhooks.get()`, `.update()`

---

### 3.9 Activity Log

#### `GET /api/v1/activity?page=1&limit=50`

**Response 200:**
```json
{
  "data": [
    {
      "id": "act_001",
      "timestamp": "2024-12-15T14:32:08Z",
      "type": "payment",
      "message": "Pagamento MBWay recebido — €450,00",
      "severity": "success",
      "metadata": { "transaction_id": "TXN-8F4K2M", "country": "PT" }
    }
  ],
  "pagination": { "page": 1, "limit": 50, "total": 2847 }
}
```

---

## 4. Modelo de Dados (Prisma Schema Proposto)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"  // migrar de SQLite
  url      = env("DATABASE_URL")
}

model User {
  id             String    @id @default(cuid())
  username       String    @unique
  email          String    @unique
  password_hash  String
  role           Role      @default("viewer")
  organization   Organization @relation(fields: [organization_id], references: { id })
  organization_id String
  two_factor_secret String?
  created_at     DateTime  @default(now())
  updated_at     DateTime  @updatedAt
  sessions       Session[]
  apiKeys        ApiKey[]
}

model Session {
  id           String   @id @default(cuid())
  user_id      String
  user         User     @relation(fields: [user_id], references: { id }, onDelete: Cascade)
  token_hash   String   @unique
  refresh_hash String   @unique
  ip_address   String?
  user_agent   String?
  expires_at   DateTime
  created_at   DateTime @default(now())
}

model Organization {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  webhook_url String?
  webhook_secret String?
  users     User[]
  created_at DateTime @default(now())
}

model SystemState {
  id                String   @id @default(cuid())
  country_code      String
  payment_method    String
  availability_status AvailabilityStatus
  provider_name     String?
  priority          Int      @default(1)
  fee_percent       Float?
  fee_fixed         Float?
  sla_hours         Int?
  max_volume_daily  Int?
  used_volume_daily Int?
  remaining_volume  Int?
  capacity_status   CapacityStatus
  notes             String?
  is_local          Boolean  @default(false)
  enabled           Boolean  @default(true)
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt

  @@unique([country_code, payment_method])
  @@index([country_code])
  @@index([availability_status])
}

model Transaction {
  id              String           @id @default(cuid())
  external_id     String?
  type            TransactionType
  status          TransactionStatus
  amount          Decimal          @db.Decimal(15, 2)
  amount_refunded Decimal?         @db.Decimal(15, 2)
  currency        String
  country_code    String
  payment_method  String
  provider_name   String
  payer_name      String?
  payer_email     String?
  payee_id        String
  metadata        Json?
  error_code      String?
  error_message   String?
  settled_at      DateTime?
  created_at      DateTime         @default(now())
  updated_at      DateTime         @updatedAt

  timeline        TransactionEvent[]

  @@index([status])
  @@index([country_code])
  @@index([created_at])
  @@index([type])
}

model TransactionEvent {
  id        String   @id @default(cuid())
  txn_id    String
  event     String
  timestamp DateTime @default(now())
  details   Json
  transaction Transaction @relation(fields: [txn_id], references: { id }, onDelete: Cascade)
}

model PaymentLink {
  id              String   @id @default(cuid())
  url             String   @unique
  short_code      String   @unique
  amount          Decimal  @db.Decimal(15, 2)
  currency        String
  country_code    String
  payment_method  String?
  status          PaymentLinkStatus
  payer_name      String?
  paid_at         DateTime?
  expires_at      DateTime
  checkout_url    String?
  metadata        Json?
  created_at      DateTime @default(now())
}

model ApiKey {
  id           String          @id @default(cuid())
  name         String
  key_hash     String          @unique
  key_prefix   String
  environment  KeyEnvironment
  status       KeyStatus
  last_used_at DateTime?
  last_ips     String[]
  user_id      String
  user         User            @relation(fields: [user_id], references: { id }, onDelete: Cascade)
  revoked_at   DateTime?
  created_at   DateTime        @default(now())
}

model WebhookEvent {
  id          String  @id @default(cuid())
  name        String  @unique
  description String
  enabled     Boolean @default(true)
}

model WebhookDelivery {
  id           String   @id @default(cuid())
  url          String
  event        String
  payload      Json
  status_code  Int?
  response     String?
  duration_ms  Int?
  attempt      Int      @default(1)
  created_at   DateTime @default(now())
}

// Enums
enum Role { admin operator viewer }
enum AvailabilityStatus { AVAILABLE LIMITED CRITICAL INTEGRATION_IN_PROGRESS }
enum CapacityStatus { UNLIMITED LIMITED DEPLETED }
enum TransactionType { payment settlement conversion refund }
enum TransactionStatus { completed pending processing failed }
enum KeyStatus { active revoked }
enum KeyEnvironment { production sandbox }
enum PaymentLinkStatus { active paid expired cancelled }
```

---

## 5. Plano de Migração: Mock → Real

### Fase 1 — Backend Setup (Estimativa: 2-3 semanas)

1. **Configurar PostgreSQL** (Vercel Postgres ou Supabase)
2. **Migrar Prisma schema** (SQLite → PostgreSQL)
3. **Implementar auth** (JWT + bcrypt + refresh tokens)
4. **Criar API routes** em `src/app/api/v1/`
5. **Popular `system_state`** tabela com dados reais

### Fase 2 — API Implementation (Estimativa: 3-4 semanas)

6. `POST /api/v1/auth/login` + `GET /api/v1/auth/me`
7. `GET /api/v1/system-state` (ler da DB)
8. `GET /api/v1/dashboard/stats` (aggregações SQL)
9. `GET /api/v1/transactions` + `GET /api/v1/transactions/:id`
10. `GET /api/v1/pipeline`
11. `POST /api/v1/payment-links` + `GET /api/v1/payment-links`
12. `GET /api/v1/api-keys` + `POST /api/v1/api-keys` + `DELETE /api/v1/api-keys/:id`
13. `GET /api/v1/webhooks` + `PUT /api/v1/webhooks`
14. `GET /api/v1/activity`

### Fase 3 — Frontend Migration (Estimativa: 1-2 semanas)

15. Substituir `auth-store.ts` hardcoded → `api.auth.login()`
16. Substituir `mock-system-state.ts` → `api.systemState.list()`
17. Migrar cada componente para usar `api.*` client
18. Adicionar TanStack Query para cache + revalidation
19. Adicionar error boundaries + loading states
20. Adicionar SSE/WebSocket para activity feed em tempo real

### Fase 4 — Provider Integration (Estimativa: 2-4 semanas)

21. Stripe SDK (pagamentos, checkout sessions)
22. Webhook delivery system (HMAC-SHA256 signing)
23. Provider routing engine (prioridade, fallback)
24. Rate limiting (Upstash)
25. Monitoring (Sentry + Vercel Analytics)

### Ficheiros a Modificar no Frontend

| Ficheiro | Mudança |
|----------|---------|
| `src/lib/auth-store.ts` | Substituir hardcoded por `api.auth.*` |
| `src/lib/mock-system-state.ts` | Eliminar `systemStateMock`, manter `countryMeta` + helpers |
| `src/components/dashboard/capacity-matrix.tsx` | `api.systemState.list()` |
| `src/components/dashboard/dashboard-overview.tsx` | `api.dashboard.stats()` |
| `src/components/dashboard/transactions-table.tsx` | `api.transactions.list()` |
| `src/components/dashboard/logistic-pipeline.tsx` | `api.pipeline.get()` |
| `src/components/dashboard/payment-link-generator.tsx` | `api.paymentLinks.create()` |
| `src/components/dashboard/api-management.tsx` | `api.apiKeys.*` + `api.webhooks.*` |
| `src/components/dashboard/sidebar.tsx` | Stats via `api.systemState.list()` |

### Ficheiros a Criar

| Ficheiro | Descrição |
|----------|-----------|
| `src/app/api/v1/auth/login/route.ts` | Auth endpoint |
| `src/app/api/v1/auth/me/route.ts` | Session validation |
| `src/app/api/v1/system-state/route.ts` | System state reader |
| `src/app/api/v1/dashboard/stats/route.ts` | Stats aggregator |
| `src/app/api/v1/transactions/route.ts` | Transactions CRUD |
| `src/app/api/v1/pipeline/route.ts` | Pipeline data |
| `src/app/api/v1/payment-links/route.ts` | Payment links CRUD |
| `src/app/api/v1/api-keys/route.ts` | API keys CRUD |
| `src/app/api/v1/webhooks/route.ts` | Webhook config |
| `src/hooks/use-system-state.ts` | TanStack Query hook |
| `src/hooks/use-transactions.ts` | TanStack Query hook |
| `src/providers/query-provider.tsx` | TanStack Query provider |

---

## 6. Segurança

| Aspecto | Implementação |
|---------|---------------|
| Autenticação | JWT (RS256) + refresh tokens rotativos |
| Passwords | bcrypt (cost factor 12) |
| API Keys | SHA-256 hash (nunca stored plaintext) |
| Rate Limiting | Por IP + por API key (Upstash) |
| Webhook Signing | HMAC-SHA256 com secret per-merchant |
| CORS | Whitelist de domínios |
| Headers | `X-Request-ID`, `X-RateLimit-Remaining` |
| Input Validation | Zod schemas em cada endpoint |

---

## 7. Performance Targets

| Métrica | Target |
|---------|--------|
| First Contentful Paint | < 1.5s |
| API Response Time (p95) | < 200ms |
| Dashboard Load (full) | < 2s |
| Real-time Activity Latency | < 500ms (SSE) |
| Uptime SLA | 99.95% |

---

## 8. Glossário

| Termo | Definição |
|-------|-----------|
| **Trilho** | Método de pagamento (ex: MBWay, iDEAL, Bizum) |
| **Provider** | Provedor de serviços de pagamento (ex: Stripe) |
| **Pipeline** | Fluxo logístico financeiro (gateway → liquidez → entrega) |
| **Routing** | Seleção dinâmica do trilho/provider para uma transação |
| **SLA** | Service Level Agreement — tempo garantido de processamento |
| **Capacidade** | Limite de volume diário por trilho |
| **Rail Local** | Método de pagamento específico de um mercado |
| **Checkout URL** | URL Stripe para pagamento real |
