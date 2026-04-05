# NeXFlowX — Dossier Técnico Completo

**Versão:** 3.1.0  
**API Backend:** v5.3.1-dev  
**Data:** Julho 2025  
**Autor:** NeXTrustX Engineering  
**Classificação:** Interno — Confidencial  
**Fonte de Verdade:** OpenAPI v5.3.1-dev  
**Repositório:** `https://github.com/nexflowx-hub/NeXFlowX-Fintech`

---

## 1. Visão Geral do Projeto

### 1.1 O que é o NeXFlowX Core Banking?

Plataforma **B2B2C de Core Banking** que permite a utilizadores gerir dinheiro real através de:

- **Carteiras Multi-Moeda** (EUR, USDT, GBP, BRL)
- **Conversões FX** entre moedas
- **Levantamentos** (IBAN, SEPA, PIX, Crypto, Bank Transfer)
- **Depósitos** via links de pagamento gerados
- **Developer Hub** com gestão de API Keys, Webhooks e Documentação
- **Painel de Administração** com liquidez do sistema e aprovações

### 1.2 Público-Alvo (3 Perfis de Acesso)

| Role | Descrição | Acessos |
|------|-----------|---------|
| **Customer** | Conta Particular (utilizador final) | Wallets, Swap, Payouts, Deposits. Developer API **BLOQUEADO** com CTA de upgrade. |
| **Merchant** | Conta Business (ex: XDeals) | Tudo do Customer **+ Acesso TOTAL** ao Developer Hub. |
| **Admin** | Backoffice (operador) | Tudo do Merchant **+ System Liquidity** + **Action Tickets** para aprovação. |

### 1.3 Backend

| Dimensão | Valor |
|----------|-------|
| API Base URL | `https://api-dev.nexflowx.tech/api/v1` |
| Ambiente | Sandbox (desenvolvimento) |
| Autenticação | JWT Bearer Token |
| Segundária | x-api-key (para payment-links) |

---

## 2. Arquitetura Técnica

### 2.1 Stack Tecnológico

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│  Next.js 16 · App Router · TypeScript 5             │
│  Tailwind CSS 4 · shadcn/ui (47 componentes)         │
│  Lucide React · Framer Motion · Canvas API           │
│  Zustand (UI state) · TanStack Query (server state)  │
├─────────────────────────────────────────────────────┤
│                    DATA LAYER                        │
│  Hooks Layer (useWallets, useSwap, usePayout...)     │
│  API Client (client.ts — Fetch + JWT interceptor)    │
├─────────────────────────────────────────────────────┤
│                   BACKEND (API V5.3.1-dev)              │
│  api-dev.nexflowx.tech/api/v1                      │
│  JWT Auth · RBAC (admin/merchant/customer)          │
│  Wallets · Swap · Payout · Ledger · Payment-Links    │
│  Action Tickets · Settings                         │
└─────────────────────────────────────────────────────┘
```

### 2.2 Estrutura de Ficheiros

```
src/
├── app/
│   ├── layout.tsx                    # Root layout + Providers (TanStack Query)
│   ├── page.tsx                      # Auth gate → LoginPage or DashboardShell
│   ├── globals.css                   # Cyberpunk glassmorphism theme
│   └── api/route.ts                 # Health check
│
├── components/
│   ├── providers.tsx                 # QueryClientProvider wrapper
│   ├── floating-ai-widget.tsx        # AI Chatbot shell (Fase 2 prep)
│   ├── login-page.tsx                # Login + Canvas animation
│   │
│   └── dashboard/
│       ├── dashboard-shell.tsx       # Layout: Sidebar + Header + Section router
│       ├── sidebar.tsx               # 8 nav items (2 admin-only)
│       ├── header.tsx                # Role badge + BANK:// prefix + clock
│       ├── dashboard-overview.tsx    # Financial summary + quick actions
│       │
│       ├── wallet-cards.tsx          # Multi-currency cards + clearing bar
│       ├── swap-widget.tsx           # FX conversion form
│       ├── payout-widget.tsx         # Withdrawal form (5 methods)
│       ├── deposit-widget.tsx        # Top-up via payment-links
│       ├── financial-activity-table.tsx# Ledger + Direction column
│       │
│       ├── api-management.tsx        # Developer Hub (RBAC: customer=locked)
│       ├── settings-security.tsx     # Password, Email, 2FA, Notifications
│       ├── admin-approval-table.tsx  # Admin: Action Tickets
│       └── system-liquidity-panel.tsx# Admin: Treasury/FX/Fee aggregation
│
├── hooks/
│   ├── use-wallets.ts              # 7 hooks: wallets, swap, payout, deposit, ledger, tickets
│   ├── use-mobile.ts
│   └── use-toast.ts
│
└── lib/
    ├── api/
    │   ├── contracts.ts             # ALL TypeScript types + Adapters (mapWallet, safeNum)
    │   └── client.ts                # API V5 client: 7 modules
    ├── auth-store.ts               # Zustand + persist + role guards
    ├── dashboard-store.ts          # Zustand: 10 sections
    ├── db.ts                      # Prisma SQLite
    └── utils.ts                   # cn() utility
```

### 2.3 Design System (Preservado Intacto)

| Token | Valor | Uso |
|-------|-------|-----|
| Background | `#0A0A0C` | Fundo principal |
| Foreground | `#E0E0E8` | Texto principal |
| Neon Green | `#00FF41` | Saldo disponível, estados ativos |
| Neon Red | `#FF0040` | Erros, alertas, FEE/REFUND |
| Neon Amber | `#FFB800` | Funds in clearing, pending |
| Neon Cyan | `#00F0FF` | Swap, FX, LIVE badge |
| Neon Purple | `#BF40FF` | Fee wallet, FX pool |
| Panel BG | `rgba(15,15,20,0.7)` + blur(20px) | Glassmorphism |
| Font Mono | Geist Mono | Dados técnicos |
| Font Sans | Geist Sans | UI text |

---

## 3. Contrato API V5.3.1-dev (OpenAPI — Fonte Única de Verdade)

### Base URL: `https://api-dev.nexflowx.tech/api/v1`
### Autenticação: `Authorization: Bearer <jwt>`

---

### 3.1 Auth

#### `POST /auth/login` (público)
```json
// Request
{ "username": "XDeals", "password": "xdeals123" }

// Response 200
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "1", "username": "XDeals", "role": "merchant" }
}
```

**Roles retornadas:** `admin`, `merchant`, `customer`

---

### 3.2 Wallets

#### `GET /wallets` (autenticado)
```json
// Response 200
{
  "data": [
    {
      "id": "w_001",
      "currency_code": "EUR",
      "type": "merchant",
      "balance_total": 1500.00,
      "balance_available": 1200.00
    },
    {
      "id": "w_002",
      "currency_code": "USDT",
      "type": "merchant",
      "balance_total": 500.00,
      "balance_available": 500.00
    }
  ]
}
```

**Wallet types:** `merchant`, `treasury`, `fee`, `fx_pool`

**Regra CRÍTICA:** O frontend NUNCA mistura saldos de moedas diferentes. Exibe sempre por currency_code isolado.

---

### 3.3 Swap

#### `POST /swap` (autenticado)
```json
// Request — amount aceita string numérica OU number
{ "amount": "10.50", "from_currency": "EUR", "to_currency": "USDT" }

// Response 200
{ "success": true, "converted": 11.42, "fee": 0.05 }
// Response 400
// "Saldo insuficiente ou payload inválido"
```

---

### 3.4 Payout

#### `POST /payout` (autenticado)
```json
// Request — amount aceita string numérica OU number
{
  "amount": 38.12,
  "currency": "EUR",
  "method": "IBAN",
  "destination": "PT50 0000 0000 1234 5678 9012 3"
}

// Response 200
{ "success": true, "message": "Payout trancado e ticket gerado" }
```

**Métodos suportados:** `IBAN`, `CRYPTO`, `PIX`, `SEPA`, `BANK`

---

### 3.5 Ledger (Extrato Financeiro)

#### `GET /ledger` (autenticado)
```json
// Response 200
{
  "data": [
    {
      "id": "led_001",
      "type": "SWAP",
      "status": "cleared",
      "direction": "CREDIT",
      "amount": 11.42,
      "currency": "USDT",
      "description": "EUR → USDT conversion",
      "created_at": "2025-07-04T14:32:08Z"
    }
  ]
}
```

**Campos novos vs API antiga:** `direction` (CREDIT/DEBIT) adicionado.

---

### 3.6 Payment Links (Depósito)

#### `POST /payment-links` (autenticado via x-api-key)
```json
// Request — amount aceita string numérica OU number
{ "amount": "100.00", "currency": "EUR" }

// Response 201
{
  "data": { "id": "pl_001", "shareable_url": "https://pay.nexflowx.tech/checkout/..." }
}
```

**Nota:** Usa header `x-api-key` (o token JWT do utilizador) em vez de Bearer.

---

### 3.7 Action Tickets (Admin)

#### `GET /action-tickets` (admin only)
```json
// Response 200
{
  "data": [
    {
      "id": "tick_001",
      "type": "payout",
      "priority": "high",
      "status": "pending_review",
      "merchant": { "username": "XDeals" },
      "metadata": {}
    }
  ]
}
```

#### `POST /action-tickets/{id}/approve` (admin only)
```json
// Response 200
{ "success": true, "message": "Ticket aprovado e fundos libertados" }
```

---

## 4. Arquitetura Frontend (Camadas)

```
┌─────────────────────────────────────────────┐
│              UI LAYER (Componentes .tsx)          │
│  ZERO fetches diretos. Tudo via hooks/store.     │
└──────────────────┬──────────────────────────────┘
                   │ useWallets(), useSwap(), usePayout()...
                   ▼
┌─────────────────────────────────────────────┐
│              HOOKS LAYER                        │
│  TanStack Query: useQuery (GET) + useMutation (POST)│
│  Cache, auto-invalidation, loading/error states. │
└──────────────────┬──────────────────────────────┘
                   │ api.wallets.list(), api.swap.execute()...
                   ▼
┌─────────────────────────────────────────────┐
│              API CLIENT LAYER                    │
│  src/lib/api/client.ts — 7 módulos:           │
│  auth, wallets, swap, payout, ledger,          │
│  actionTickets, paymentLinks                   │
└──────────────────┬──────────────────────────────┘
                   │ fetch() + Bearer token
                   ▼
┌─────────────────────────────────────────────┐
│              BACKEND (api-dev.nexflowx.tech)     │
│              API V5.3.1-dev                     │
└─────────────────────────────────────────────┘
```

---

## 5. Sistema de Navegação (10 Secções)

### DashboardSection (Zustand)
```typescript
type DashboardSection =
  | 'dashboard'    // Painel Financeiro
  | 'wallets'     // Carteiras digitais
  | 'swap'        // Conversão FX
  | 'payouts'     // Levantamentos
  | 'deposits'    // Depósitos (Top-up)
  | 'activity'    // Atividade Financeira (Ledger)
  | 'settings'    // Definições & Segurança
  | 'developer'   // Developer Hub (API Keys, Webhooks, Docs)
  | 'approvals'   // [ADMIN] Aprovações
  | 'liquidity';  // [ADMIN] Liquidez do Sistema
```

### RBAC por Secção

| Secção | Customer | Merchant | Admin |
|--------|----------|---------|-------|
| Dashboard | ✅ | ✅ | ✅ |
| Wallets | ✅ | ✅ | ✅ |
| Swap FX | ✅ | ✅ | ✅ |
| Payouts | ✅ | ✅ | ✅ |
| Deposits | ✅ | ✅ | ✅ |
| Activity | ✅ | ✅ | ✅ |
| Settings | ✅ | ✅ | ✅ |
| **Developer** | 🔒 **BLOQUEADO** | ✅ FULL | ✅ FULL |
| Approvals | ❌ hidden | ❌ hidden | ✅ |
| Liquidity | ❌ hidden | ❌ hidden | ✅ |

---

## 6. Adapters e Normalização de Dados

### 6.1 `mapWallet(raw)` — Contrato API → Frontend
```typescript
export function mapWallet(raw: Record<string, unknown>): Wallet {
  return {
    id: String(raw.id ?? ''),
    currency_code: String(raw.currency_code ?? raw.currency ?? 'EUR'),
    type: (String(raw.type ?? 'merchant')) as WalletType,
    balance_total: safeNum(raw.balance_total),    // "25.50" → 25.5
    balance_available: safeNum(raw.balance_available),
  };
}
```

### 6.2 `safeNum(val)` — Proteção contra NaN
```typescript
function safeNum(val: unknown): number {
  const n = Number(val);
  return isFinite(n) ? n : 0;
}
```

### 6.3 `mapLedgerEntry(raw)` — Com direction
```typescript
export function mapLedgerEntry(raw: Record<string, unknown>): LedgerEntry {
  return {
    id: String(raw.id ?? ''),
    type: (String(raw.type ?? 'PAYIN')) as LedgerEntryType,
    status: (String(raw.status ?? 'pending')) as LedgerEntryStatus,
    direction: (String(raw.direction ?? 'CREDIT')) as LedgerDirection,
    amount: safeNum(raw.amount),
    currency: String(raw.currency ?? 'EUR'),
    description: raw.description ? String(raw.description) : undefined,
    created_at: String(raw.created_at ?? new Date().toISOString()),
  };
}
```

---

## 7. Funcionalidades Implementadas

### 7.1 Dashboard Overview
- ✅ Saldo disponível **por moeda** (sem mistura EUR/USDT)
- ✅ Quick Actions: Converter Moeda, Depositar, Levantamento, Ver Atividade
- ✅ Atividade Recente (últimos 10 ledger entries via `GET /ledger`)

### 7.2 Wallet Cards
- ✅ Cards multi-currency com emoji flags
- ✅ balance_available como número PRIMÁRIO (grande, verde neon)
- ✅ balance_total subtil (cinza)
- ✅ **Clearing visualization**: progress bar amarela + badge "Funds in clearing" quando `total > available`
- ✅ Wallet type badge (merchant=verde, treasury=amarelo, fee=roxo, fx_pool=ciano)

### 7.3 Swap Widget
- ✅ Select de moedas origem/destino (EUR, USDT, GBP, USD)
- ✅ Botão de inversão de moedas
- ✅ `amount` aceita string numérica ou number
- ✅ Preview: taxa de serviço 0.50%
- ✅ Loading spinner + disable durante submit
- ✅ Toast de sucesso/erro

### 7.4 Payout Widget
- ✅ 5 métodos: IBAN, SEPA, PIX, CRYPTO, BANK
- ✅ Placeholders dinâmicos por método
- ✅ **Dialog de Confirmação** com resumo (valor, moeda, método, destino mascarado)
- ✅ Estado de sucesso: "Pedido enviado para processamento"
- ✅ Toast feedback

### 7.5 Deposit Widget
- ✅ Form: amount + currency (EUR, USDT)
- ✅ Chama `POST /payment-links` via `x-api-key` header
- ✅ Dialog com shareable_url + Copy Link + Open in New Tab
- ✅ Invalida wallets + ledger após sucesso

### 7.6 Financial Activity Table (Ledger)
- ✅ Tabs: Ledger + Payment Events (placeholder)
- ✅ Colunas: Tipo, Status, Direção, Montante, Moeda, Descrição, Data
- ✅ Filtros: tipo (PAYIN/SWAP/PAYOUT/FEE/REFUND) + status (pending/cleared/failed)
- ✅ Badges coloridos por tipo
- ✅ Direção: CREDIT=verde, DEBIT=vermelho
- ✅ Summary stats: total de entradas + volume cleared

### 7.7 Developer Hub (RBAC)
- ✅ **Customer**: Vista BLOQUEADA com Lock icon + CTA upgrade + 3 cards desfocadas
- ✅ **Merchant/Admin**: 3 tabs completos:
  - **Chaves API**: Listar, mostrar/ocultar hash, copiar, gerar nova chave
  - **Webhooks**: URL form, HMAC secret, eventos suportados
  - **Documentação**: Auth, endpoints, cURL examples, error codes

### 7.8 Settings & Security
- ✅ Tab 1: Alterar Password (com validação + progress bar)
- ✅ Tab 2: Gestão de Email
- ✅ Tab 3: 2FA (placeholder — toggle disabled + "em breve")
- ✅ Tab 4: Notificações (placeholder — 4 toggles disabled)

### 7.9 Admin Panel
- ✅ **System Liquidity Panel**: Agrega Treasury + FX Pool + Fee wallets por moeda
- ✅ **Action Tickets Table**: Lista tickets pendentes, botão Aprovar (loading state)

### 7.10 Floating AI Widget
- ✅ FAB flutuante (bottom-right) com animação `cyber-breathe`
- ✅ Sheet com "NeXFlowX AI Assistant" header + badge "EM BREVE"
- ✅ Mensagens placeholder + input desabilitado "Aguardando ativação..."

### 7.11 Login
- ✅ Canvas animation (financial flow nodes — preservado)
- ✅ Branding: "Core Banking v3.0"
- ✅ Backend status: api-dev.nexflowx.tech
- ✅ Stats: ∞ WALLETS / 50+ FX PAIRS / 24/7 UPTIME

---

## 8. State Management

| Store | Libraria | Persistido | Função |
|-------|----------|----------|--------|
| Auth Store | Zustand + persist | ✅ (`nexflowx-auth`) | Token, user, role |
| Dashboard Store | Zustand | ❌ | activeSection, sidebarCollapsed |
| Server State | TanStack Query | ❌ (memória) | Wallets, Ledger, Action Tickets |

### Role Guards (auth-store.ts)
```typescript
isAdmin(user)      // → boolean
isMerchant(user)   // → boolean
isCustomer(user)  // → boolean
getUserRole(user)  // → 'admin' | 'merchant' | 'customer'
```

---

## 9. Glossário

| Termo | Definição |
|-------|-----------|
| **Wallet** | Carteira digital associada a uma moeda e tipo |
| **Balance Available** | Saldo utilizável para transações imediatas |
| **Balance Total** | Saldo total incluindo fundos pendentes de clearing |
| **Clearing** | Processo de liquidação de fundos (total - available) |
| **Swap** | Conversão de moeda FX (ex: EUR → USDT) |
| **Payout** | Levantamento / Withdrawal via IBAN, SEPA, PIX, Crypto, Bank |
| **Deposit** | Depósito via link de pagamento gerado |
| **Ledger** | Livro-razão — histórico completo de movimentações |
| **Direction** | CREDIT (entrada) ou DEBIT (saída) no ledger |
| **Action Ticket** | Pedido de operação pendente de aprovação (admin) |
| **Developer Hub** | Secção de gestão de API Keys, Webhooks e Documentação |
| **RBAC** | Role-Based Access Control (admin/merchant/customer) |

---

## 10. Versões e Changelog

| Versão | Data | Mudanças |
|--------|------|----------|
| v3.1.0 | Jul 2025 | OpenAPI v5.3.1-dev alinhado. 3 roles (admin/merchant/customer). Developer Hub com RBAC. 5 métodos de payout. Direction no ledger. Deposit widget. Bug da Soma Mágica corrigido. |
| v3.0.0 | Jun 2025 | Domínio migrado de Payment Orchestration → Core Banking. Wallet Cards, Swap, Payout, Settings, Admin panels. Floating AI Widget shell. |
| v2.9.8 | Mai 2025 | Dashboard original: Pipeline, Transações, Payment Links, API Management, Capacity Matrix. |

---

*Este documento é a fonte de verdade arquitetural do frontend NeXFlowX Core Banking. Qualquer implementação deve ser validada contra o OpenAPI v5.3.1-dev.*
