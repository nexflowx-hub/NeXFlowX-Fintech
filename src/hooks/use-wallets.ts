'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, NexFlowXAPIError } from '@/lib/api/client';
import type { Wallet } from '@/lib/api/contracts';
import { mapWallet } from '@/lib/api/contracts';

export function useWallets() {
  return useQuery({
    queryKey: ['wallets'],
    queryFn: async () => {
      const res = await api.wallets.list();
      const rawArray = Array.isArray(res.data) ? res.data : [];
      return rawArray.map(mapWallet) as Wallet[];
    },
  });
}

export function useSwap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { amount: number; from_currency: string; to_currency: string }) => {
      return api.swap.execute(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallets'] });
      qc.invalidateQueries({ queryKey: ['ledger'] });
    },
  });
}

export function usePayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { amount: number; currency: string; method: 'IBAN' | 'CRYPTO'; destination: string }) => {
      return api.payout.request(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallets'] });
      qc.invalidateQueries({ queryKey: ['ledger'] });
    },
  });
}

export function useLedger(query: Record<string, string> = {}) {
  return useQuery({
    queryKey: ['ledger', query],
    queryFn: async () => {
      return api.ledger.list(query);
    },
  });
}

export function useActionTickets() {
  return useQuery({
    queryKey: ['action-tickets'],
    queryFn: async () => {
      const res = await api.actionTickets.list();
      const rawArray = Array.isArray(res.data) ? res.data : [];
      return rawArray.map((raw: Record<string, unknown>) => mapActionTicket(raw));
    },
  });
}

function mapActionTicket(raw: Record<string, unknown>) {
  return {
    id: String(raw.id ?? ''),
    payout_id: raw.payout_id ? String(raw.payout_id) : undefined,
    merchant_id: raw.merchant_id ? String(raw.merchant_id) : undefined,
    merchant_name: raw.merchant_name ? String(raw.merchant_name) : 'N/A',
    amount: Number(raw.amount) || 0,
    currency: String(raw.currency ?? 'EUR'),
    method: String(raw.method ?? 'IBAN'),
    destination: raw.destination ? String(raw.destination) : '',
    status: String(raw.status ?? 'pending_review'),
    created_at: String(raw.created_at ?? new Date().toISOString()),
  };
}

export function useApproveTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.actionTickets.approve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['action-tickets'] });
    },
  });
}

export function useRejectTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.actionTickets.reject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['action-tickets'] });
    },
  });
}
