'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, NexFlowXAPIError } from '@/lib/api/client';
import type { Wallet, PayoutMethod } from '@/lib/api/contracts';
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
    mutationFn: async (payload: { amount: number; currency: string; method: PayoutMethod; destination: string }) => {
      return api.payout.request(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallets'] });
      qc.invalidateQueries({ queryKey: ['ledger'] });
    },
  });
}

export function useDeposit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { amount: number | string; currency: string }) => {
      return api.paymentLinks.create(payload);
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
  const merchant = raw.merchant as Record<string, unknown> | undefined;
  return {
    id: String(raw.id ?? ''),
    type: raw.type ? String(raw.type) : undefined,
    priority: raw.priority ? String(raw.priority) : undefined,
    merchant_name: merchant?.username ? String(merchant.username) : 'N/A',
    status: String(raw.status ?? 'pending_review'),
    metadata: raw.metadata as Record<string, unknown> | undefined,
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


