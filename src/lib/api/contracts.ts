/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NeXFlowX Core Banking — TypeScript Contracts V5.3.1-dev
 *
 * Matches the backend at https://api-dev.nexflowx.tech/api/v1
 * Includes adapters for API → Frontend normalization.
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ─── ENUMS & HELPERS ─────────────────────────────────────────────────────

export type UserRole = 'admin' | 'merchant' | 'customer';

export type WalletType = 'merchant' | 'treasury' | 'fee' | 'fx_pool';

export type LedgerEntryType = 'PAYIN' | 'SWAP' | 'PAYOUT' | 'FEE' | 'REFUND';

export type LedgerEntryStatus = 'pending' | 'cleared' | 'failed';

export type LedgerDirection = 'CREDIT' | 'DEBIT';

export type PayoutMethod = 'IBAN' | 'CRYPTO' | 'PIX' | 'SEPA' | 'BANK';

export type ActionTicketStatus = 'pending_review' | 'approved' | 'rejected' | 'processing';

/** Amount fields accept number or string from the API */
export type NumericOrString = number | string;

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
    direction: String(raw.direction ?? 'CREDIT') as LedgerDirection,
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
    type: raw.type ? String(raw.type) : undefined,
    priority: raw.priority ? String(raw.priority) : undefined,
    merchant: raw.merchant
      ? { username: String((raw.merchant as Record<string, unknown>)?.username ?? '') }
      : undefined,
    metadata: raw.metadata as Record<string, unknown> | undefined,
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
  token: string;
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
  data: Wallet[];
}

// ─── 3. SWAP ─────────────────────────────────────────────────────────────

export interface SwapRequest {
  amount: NumericOrString;
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
  amount: NumericOrString;
  currency: string;
  method: PayoutMethod;
  destination: string;
}

export interface PayoutResponse {
  success: boolean;
  message: string;
}

// ─── 5. PAYMENT LINKS ────────────────────────────────────────────────────

export interface PaymentLinkRequest {
  amount: NumericOrString;
  currency: string;
}

export interface PaymentLinkData {
  id: string;
  shareable_url: string;
}

export interface PaymentLinkResponse {
  data: PaymentLinkData;
}

// ─── 6. LEDGER / FINANCIAL ACTIVITY ─────────────────────────────────────

export interface LedgerEntry {
  id: string;
  type: LedgerEntryType;
  status: LedgerEntryStatus;
  direction: LedgerDirection;
  amount: number;
  currency: string;
  description?: string;
  reference?: string;
  created_at: string;
}

export interface LedgerResponse {
  data: LedgerEntry[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// ─── 7. ACTION TICKETS (Admin) ─────────────────────────────────────────

export interface ActionTicket {
  id: string;
  type?: string;
  priority?: string;
  merchant?: { username: string };
  metadata?: Record<string, unknown>;
  status: ActionTicketStatus;
  created_at: string;
}

export interface ActionTicketsResponse {
  data: ActionTicket[];
}

export interface ApproveTicketResponse {
  success: boolean;
  message: string;
}

// ─── 8. SETTINGS ─────────────────────────────────────────────────────────

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

export interface UpdateNotificationsRequest {
  email_notifications?: boolean;
  transaction_alerts?: boolean;
  weekly_reports?: boolean;
  security_alerts?: boolean;
}

// ─── 9. API KEYS ─────────────────────────────────────────────────────

export interface ApiKey {
  id: string;
  key_hash: string;
  label?: string;
  created_at: string;
  last_used_at?: string;
  is_active: boolean;
}

export interface ApiKeysResponse {
  data: ApiKey[];
}

export interface CreateApiKeyResponse {
  data: {
    key: string;
    key_hash: string;
    label?: string;
    created_at: string;
  };
}

// ─── 10. USERS (Profile) ────────────────────────────────────────────────

export interface UserMeResponse {
  data: {
    id: string;
    username: string;
    email: string;
    role: UserRole;
    organization_id: string;
    webhook_url?: string;
    hmac_secret?: string;
    created_at: string;
  };
}

export interface UpdateUserMeRequest {
  email?: string;
  webhook_url?: string;
  email_notifications?: boolean;
  transaction_alerts?: boolean;
  weekly_reports?: boolean;
  security_alerts?: boolean;
}

export interface UpdateUserMeResponse {
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
