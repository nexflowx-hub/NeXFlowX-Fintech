/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NeXFlowX Core Banking — TypeScript Contracts V5
 *
 * Matches the backend at https://api-dev.nexflowx.tech/api/v1
 * Includes adapters for API → Frontend normalization.
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ─── ENUMS & HELPERS ─────────────────────────────────────────────────────

export type UserRole = 'admin' | 'merchant';

export type WalletType = 'merchant' | 'treasury' | 'fee' | 'fx_pool';

export type LedgerEntryType = 'PAYIN' | 'SWAP' | 'PAYOUT' | 'FEE' | 'REFUND';

export type LedgerEntryStatus = 'pending' | 'cleared' | 'failed';

export type PayoutMethod = 'IBAN' | 'CRYPTO';

export type ActionTicketStatus = 'pending_review' | 'approved' | 'rejected' | 'processing';

// ─── ADAPTERS ────────────────────────────────────────────────────────────

/** Safe number parser — API may return strings */
function safeNum(val: unknown): number {
  const n = Number(val);
  return isFinite(n) ? n : 0;
}

/**
 * Normalize a raw API wallet response into the frontend Wallet shape.
 * Handles both `currency` and `currency_code` field names,
 * and ensures balances are always numbers.
 */
export function mapWallet(raw: Record<string, unknown>): Wallet {
  return {
    id: String(raw.id ?? ''),
    currency_code: String(raw.currency_code ?? raw.currency ?? 'EUR'),
    type: (String(raw.type ?? 'merchant')) as WalletType,
    balance_total: safeNum(raw.balance_total),
    balance_available: safeNum(raw.balance_available),
  };
}

/**
 * Normalize a raw API ledger entry into the frontend LedgerEntry shape.
 */
export function mapLedgerEntry(raw: Record<string, unknown>): LedgerEntry {
  return {
    id: String(raw.id ?? ''),
    type: (String(raw.type ?? 'PAYIN')) as LedgerEntryType,
    status: (String(raw.status ?? 'pending')) as LedgerEntryStatus,
    amount: safeNum(raw.amount),
    currency: String(raw.currency ?? 'EUR'),
    description: raw.description ? String(raw.description) : undefined,
    reference: raw.reference ? String(raw.reference) : undefined,
    created_at: String(raw.created_at ?? raw.created_at ?? new Date().toISOString()),
  };
}

/**
 * Normalize a raw API action ticket into the frontend ActionTicket shape.
 */
export function mapActionTicket(raw: Record<string, unknown>): ActionTicket {
  return {
    id: String(raw.id ?? ''),
    payout_id: raw.payout_id ? String(raw.payout_id) : undefined,
    merchant_id: raw.merchant_id ? String(raw.merchant_id) : undefined,
    merchant_name: raw.merchant_name ? String(raw.merchant_name) : 'N/A',
    amount: safeNum(raw.amount),
    currency: String(raw.currency ?? 'EUR'),
    method: (String(raw.method ?? 'IBAN')) as PayoutMethod,
    destination: raw.destination ? String(raw.destination) : '',
    status: (String(raw.status ?? 'pending_review')) as ActionTicketStatus,
    created_at: String(raw.created_at ?? new Date().toISOString()),
  };
}

// ─── 1. AUTH ─────────────────────────────────────────────────────────────

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  refresh_token?: string;
  expires_in?: number;
  user: AuthUser;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  organization_id: string;
  created_at: string;
  last_login: string | null;
}

export interface AuthMeResponse {
  success: boolean;
  user: AuthUser;
}

// ─── 2. WALLETS ──────────────────────────────────────────────────────────

export interface Wallet {
  id: string;
  currency_code: string;
  type: WalletType;
  balance_total: number;
  balance_available: number;
}

export interface WalletsResponse {
  success: boolean;
  data: Wallet[];
}

// ─── 3. SWAP ─────────────────────────────────────────────────────────────

export interface SwapRequest {
  amount: number;
  from_currency: string;
  to_currency: string;
}

export interface SwapResponse {
  success: boolean;
  converted: number;
  fee: number;
  rate?: number;
}

// ─── 4. PAYOUT ───────────────────────────────────────────────────────────

export interface PayoutRequest {
  amount: number;
  currency: string;
  method: PayoutMethod;
  destination: string;
}

export interface PayoutResponse {
  success: boolean;
  message: string;
}

// ─── 5. LEDGER / FINANCIAL ACTIVITY ─────────────────────────────────────

export interface LedgerEntry {
  id: string;
  type: LedgerEntryType;
  status: LedgerEntryStatus;
  amount: number;
  currency: string;
  description?: string;
  reference?: string;
  created_at: string;
}

export interface LedgerResponse {
  success: boolean;
  data: LedgerEntry[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// ─── 6. ACTION TICKETS (Admin) ─────────────────────────────────────────

export interface ActionTicket {
  id: string;
  payout_id?: string;
  merchant_id?: string;
  merchant_name: string;
  amount: number;
  currency: string;
  method: PayoutMethod;
  destination: string;
  status: ActionTicketStatus;
  created_at: string;
}

export interface ActionTicketsResponse {
  success: boolean;
  data: ActionTicket[];
}

export interface ApproveTicketResponse {
  success: boolean;
  message: string;
}

// ─── 7. SETTINGS ─────────────────────────────────────────────────────────

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

export interface UpdateEmailRequest {
  email: string;
}

export interface UpdateEmailResponse {
  success: boolean;
  message: string;
}

// ─── ERROR ────────────────────────────────────────────────────────────────

export interface APIError {
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  message?: string;
}
