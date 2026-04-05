/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NeXFlowX Core Banking — API Client V5.3.1-dev
 *
 * Direct calls to https://api-dev.nexflowx.tech/api/v1
 * JWT tokens stored in localStorage and injected via Authorization: Bearer
 * Payment Links use x-api-key header instead of Bearer.
 *
 * Architecture: UI → Hooks (TanStack Query) → Client → Backend
 * Components MUST NOT call this client directly — use hooks instead.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type {
  LoginRequest,
  LoginResponse,
  AuthMeResponse,
  WalletsResponse,
  SwapRequest,
  SwapResponse,
  PayoutRequest,
  PayoutResponse,
  PaymentLinkRequest,
  PaymentLinkResponse,
  LedgerResponse,
  ActionTicketsResponse,
  ApproveTicketResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  UpdateEmailRequest,
  UpdateEmailResponse,
  ApiKeysResponse,
  CreateApiKeyResponse,
  UserMeResponse,
  UpdateUserMeRequest,
  UpdateUserMeResponse,
  APIError,
} from './contracts';

// ─── CONFIG ────────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api-dev.nexflowx.tech/api/v1';

export const BACKEND_BASE_URL = API_BASE;

// ─── ERROR CLASS ───────────────────────────────────────────────────────────

export class NexFlowXAPIError extends Error {
  status: number;
  code: string;
  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = 'NexFlowXAPIError';
    this.status = status;
    this.code = code;
  }
}

// ─── HTTP CLIENT ──────────────────────────────────────────────────────────

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('nexflowx_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) ?? {}),
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    mode: 'cors',
    headers,
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as APIError | null;
    throw new NexFlowXAPIError(
      body?.error?.message ?? body?.message ?? `HTTP ${res.status}`,
      res.status,
      body?.error?.code ?? 'UNKNOWN_ERROR'
    );
  }

  return res.json() as Promise<T>;
}

// ─── 1. AUTH ──────────────────────────────────────────────────────────────

export const auth = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const res = await request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (typeof window !== 'undefined' && res.token) {
      localStorage.setItem('nexflowx_token', res.token);
    }
    return res;
  },

  async logout(): Promise<void> {
    try {
      await request('/auth/logout', { method: 'POST' });
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('nexflowx_token');
        localStorage.removeItem('nexflowx_refresh');
      }
    }
  },

  async me(): Promise<AuthMeResponse> {
    return request('/auth/me');
  },
};

// ─── 2. WALLETS ───────────────────────────────────────────────────────────

export const wallets = {
  async list(): Promise<WalletsResponse> {
    return request('/wallets');
  },
};

// ─── 3. SWAP ──────────────────────────────────────────────────────────────

export const swap = {
  async execute(data: SwapRequest): Promise<SwapResponse> {
    return request('/swap', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// ─── 4. PAYOUT ────────────────────────────────────────────────────────────

export const payout = {
  async request(data: PayoutRequest): Promise<PayoutResponse> {
    return request('/payout', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// ─── 5. PAYMENT LINKS ─────────────────────────────────────────────────────

export const paymentLinks = {
  async create(data: PaymentLinkRequest): Promise<PaymentLinkResponse> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('nexflowx_token') : null;
    return request('/payment-links', {
      method: 'POST',
      headers: {
        ...(token ? { 'x-api-key': token } : {}),
      },
      body: JSON.stringify(data),
    });
  },
};

// ─── 6. LEDGER / FINANCIAL ACTIVITY ──────────────────────────────────────

export const ledger = {
  async list(query: Record<string, string> = {}): Promise<LedgerResponse> {
    const params = new URLSearchParams(
      Object.entries(query).filter(([, v]) => v != null) as [string, string][]
    );
    return request(`/ledger${params.toString() ? `?${params}` : ''}`);
  },
};

// ─── 7. ACTION TICKETS (Admin) ───────────────────────────────────────────

export const actionTickets = {
  async list(): Promise<ActionTicketsResponse> {
    return request('/action-tickets');
  },

  async approve(id: string): Promise<ApproveTicketResponse> {
    return request(`/action-tickets/${id}/approve`, { method: 'POST' });
  },
};

// ─── 8. SETTINGS ─────────────────────────────────────────────────────────

export const settings = {
  async changePassword(data: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    return request('/settings/password', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async updateEmail(data: UpdateEmailRequest): Promise<UpdateEmailResponse> {
    return request('/settings/email', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

// ─── 9. API KEYS ────────────────────────────────────────────────────────

export const apiKeys = {
  async list(): Promise<ApiKeysResponse> {
    return request('/api-keys');
  },

  async create(label?: string): Promise<CreateApiKeyResponse> {
    return request('/api-keys', {
      method: 'POST',
      body: JSON.stringify(label ? { label } : {}),
    });
  },
};

// ─── 10. USERS ────────────────────────────────────────────────────────────

export const users = {
  async getMe(): Promise<UserMeResponse> {
    return request('/users/me');
  },

  async updateMe(data: UpdateUserMeRequest): Promise<UpdateUserMeResponse> {
    return request('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

// ─── AGGREGATED CLIENT ────────────────────────────────────────────────────

export const api = {
  auth,
  wallets,
  swap,
  payout,
  paymentLinks,
  ledger,
  actionTickets,
  settings,
  apiKeys,
  users,
};
