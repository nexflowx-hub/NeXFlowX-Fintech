'use client';

import { useState, useCallback, useMemo } from 'react';
import { Banknote, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { usePayout, useWallets } from '@/hooks/use-wallets';
import type { PayoutMethod, PayoutResponse } from '@/lib/api/contracts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

// ─── Constants ──────────────────────────────────────────────────────────────

const METHODS: { value: PayoutMethod; label: string; description: string }[] = [
  { value: 'IBAN', label: 'IBAN', description: 'Transferência SEPA' },
  { value: 'SEPA', label: 'SEPA', description: 'Crédito SEPA' },
  { value: 'PIX', label: 'PIX', description: 'Pix instantâneo (BRL)' },
  { value: 'CRYPTO', label: 'Crypto', description: 'Blockchain' },
  { value: 'BANK', label: 'Bank Transfer', description: 'Transferência bancária' },
];

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  USDT: '₮',
  GBP: '£',
  USD: '$',
  BRL: 'R$',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString('pt-BR')}`;
  }
}

/** Masks IBAN: PT50****1234 → shows first 4 and last 4 */
function maskIban(iban: string): string {
  const trimmed = iban.replace(/\s+/g, '');
  if (trimmed.length <= 8) return '••••••••';
  return `${trimmed.slice(0, 4)}${'•'.repeat(trimmed.length - 8)}${trimmed.slice(-4)}`;
}

function getDestinationLabel(method: PayoutMethod): string {
  switch (method) {
    case 'IBAN': return 'IBAN';
    case 'SEPA': return 'IBAN SEPA';
    case 'PIX': return 'Chave PIX';
    case 'CRYPTO': return 'Endereço da carteira';
    case 'BANK': return 'Dados bancários';
    default: return 'Destino';
  }
}

function getDestinationPlaceholder(method: PayoutMethod): string {
  switch (method) {
    case 'IBAN': return 'PT50 1234 5678 9012 3456 7890 12';
    case 'SEPA': return 'DE89 3704 0044 0532 0130 00';
    case 'PIX': return 'email@exemplo.com ou CPF/CNPJ';
    case 'CRYPTO': return '0x1234...abcd';
    case 'BANK': return 'Nome do banco + NIB/AG';
    default: return '';
  }
}

function getMethodDescription(method: PayoutMethod): string {
  return METHODS.find((m) => m.value === method)?.description ?? method;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function PayoutWidget() {
  const { data: wallets } = useWallets();

  // Extract unique currency codes from user's wallets (dynamic, no mock data)
  const availableCurrencies = useMemo(() => {
    if (!wallets || wallets.length === 0) return [];
    const set = new Set<string>();
    for (const w of wallets) {
      if (w.currency_code) set.add(w.currency_code);
    }
    return Array.from(set).sort();
  }, [wallets]);

  const [amount, setAmount] = useState<string>('');
  // null = not yet manually selected → derive from available currencies
  const [userCurrency, setUserCurrency] = useState<string | null>(null);
  const [method, setMethod] = useState<PayoutMethod>('IBAN');
  const [destination, setDestination] = useState<string>('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogSuccess, setDialogSuccess] = useState(false);

  const payoutMutation = usePayout();
  const isPending = payoutMutation.isPending;

  // Derive effective currency: manual override or first from wallets
  const currency = userCurrency ?? (availableCurrencies[0] ?? '');

  const currencySymbol = useMemo(() => {
    return CURRENCY_SYMBOLS[currency] ?? '';
  }, [currency]);

  const numAmount = parseFloat(amount) || 0;

  const formIsValid = numAmount > 0 && destination.trim().length > 0;

  const maskedDestination = useMemo(() => {
    if (method === 'IBAN' || method === 'SEPA') return maskIban(destination);
    return `${destination.slice(0, 6)}${'•'.repeat(Math.max(0, destination.length - 10))}${destination.slice(-4)}`;
  }, [method, destination]);

  const handleOpenDialog = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!formIsValid) {
        if (numAmount <= 0) {
          toast.error('Insira um valor válido para o levantamento.');
        } else {
          toast.error(`Preencha o campo de ${getDestinationLabel(method)}.`);
        }
        return;
      }

      setDialogSuccess(false);
      setDialogOpen(true);
    },
    [formIsValid, numAmount, method],
  );

  const handleConfirmPayout = useCallback(() => {
    payoutMutation.mutate(
      {
        amount: numAmount,
        currency,
        method,
        destination: destination.trim(),
      },
      {
        onSuccess: (_data: PayoutResponse) => {
          setDialogSuccess(true);
          toast.success('Levantamento solicitado com sucesso!');
        },
        onError: (err: Error) => {
          toast.error(err.message || 'Erro ao solicitar levantamento. Tente novamente.');
          setDialogOpen(false);
        },
      },
    );
  }, [payoutMutation, numAmount, currency, method, destination]);

  const handleDialogClose = useCallback(
    (open: boolean) => {
      if (!open && dialogSuccess) {
        // Reset form on close after success
        setAmount('');
        setDestination('');
        setDialogSuccess(false);
      }
      if (!open && isPending) return; // prevent closing during submission
      setDialogOpen(open);
    },
    [dialogSuccess, isPending],
  );

  const handleDialogCancel = useCallback(() => {
    if (isPending) return;
    setDialogOpen(false);
  }, [isPending]);

  // No wallets loaded yet
  if (!wallets) {
    return (
      <div className="cyber-panel p-5">
        <div className="flex items-center gap-2 mb-5">
          <Banknote className="w-4 h-4 text-[#BF40FF]" />
          <h3 className="text-sm font-semibold text-[#E0E0E8]">Levantamento</h3>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 text-[#BF40FF] animate-spin" />
          <span className="ml-3 text-xs cyber-mono text-[#555566]">
            A CARREGAR CARTEIRAS...
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="cyber-panel p-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <Banknote className="w-4 h-4 text-[#BF40FF]" />
          <h3 className="text-sm font-semibold text-[#E0E0E8]">Levantamento</h3>
        </div>

        <form onSubmit={handleOpenDialog} className="space-y-4">
          {/* Amount + Currency Row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Amount */}
            <div className="space-y-1.5">
              <Label className="text-xs text-[#888899]">Montante</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#555566] cyber-mono">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="cyber-input w-full rounded-md pl-8 pr-3 py-2 text-sm cyber-mono text-[#E0E0E8]"
                />
              </div>
            </div>

            {/* Currency — dynamic from wallets */}
            <div className="space-y-1.5">
              <Label className="text-xs text-[#888899]">Moeda</Label>
              <Select value={currency} onValueChange={setUserCurrency}>
                <SelectTrigger className="cyber-input w-full rounded-md px-3 py-2 text-sm text-[#E0E0E8]">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="bg-[#0F0F14] border-[rgba(51,51,51,0.8)]">
                  {availableCurrencies.map((cur) => (
                    <SelectItem key={cur} value={cur} className="text-[#E0E0E8] focus:bg-[rgba(0,255,65,0.08)] focus:text-[#00FF41]">
                      {cur}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Method */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[#888899]">Método</Label>
            <Select value={method} onValueChange={(val) => setMethod(val as PayoutMethod)}>
              <SelectTrigger className="cyber-input w-full rounded-md px-3 py-2 text-sm text-[#E0E0E8]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0F0F14] border-[rgba(51,51,51,0.8)]">
                {METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value} className="text-[#E0E0E8] focus:bg-[rgba(0,255,65,0.08)] focus:text-[#00FF41]">
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Destination */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[#888899]">{getDestinationLabel(method)}</Label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder={getDestinationPlaceholder(method)}
              className="cyber-input w-full rounded-md px-3 py-2 text-sm cyber-mono text-[#E0E0E8]"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending || !formIsValid || !currency}
            className="cyber-btn-primary w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>A processar...</span>
              </>
            ) : (
              'Solicitar Levantamento'
            )}
          </button>
        </form>
      </div>

      {/* ── Confirmation Dialog ────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent
          className="bg-[#0F0F14] border-[rgba(51,51,51,0.8)] sm:max-w-md"
          showCloseButton={!isPending && !dialogSuccess}
        >
          {dialogSuccess ? (
            /* ── Success State ── */
            <>
              <DialogHeader className="items-center text-center pt-4">
                <CheckCircle2 className="w-12 h-12 text-[#00FF41] mb-3 mx-auto" />
                <DialogTitle className="text-[#00FF41] text-lg">
                  Pedido enviado para processamento
                </DialogTitle>
                <DialogDescription className="text-[#888899] text-sm mt-2">
                  O seu levantamento de {formatCurrency(numAmount, currency)} via {method} foi submetido com sucesso e aguarda aprovação.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-4 sm:justify-center">
                <button
                  onClick={() => handleDialogClose(false)}
                  className="cyber-btn-primary px-6 py-2 rounded-lg text-sm"
                >
                  Fechar
                </button>
              </DialogFooter>
            </>
          ) : (
            /* ── Confirmation State ── */
            <>
              <DialogHeader>
                <DialogTitle className="text-[#E0E0E8]">Confirmar Levantamento</DialogTitle>
                <DialogDescription className="text-[#888899] text-sm">
                  Revise os detalhes antes de confirmar o pedido.
                </DialogDescription>
              </DialogHeader>

              {/* Summary */}
              <div className="rounded-lg bg-[rgba(10,10,14,0.5)] border border-[rgba(51,51,51,0.3)] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#555566]">Montante</span>
                  <span className="text-sm font-bold text-[#00FF41] cyber-mono">
                    {formatCurrency(numAmount, currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#555566]">Moeda</span>
                  <span className="text-sm text-[#E0E0E8] cyber-mono">{currency}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#555566]">Método</span>
                  <div className="text-right">
                    <span className="cyber-badge cyber-badge-cyan">{method}</span>
                    <p className="text-[10px] text-[#555566] mt-0.5">{getMethodDescription(method)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-[#555566] shrink-0">{getDestinationLabel(method)}</span>
                  <span className="text-sm text-[#888899] cyber-mono text-right truncate max-w-[200px]">
                    {maskedDestination}
                  </span>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <button
                  type="button"
                  onClick={handleDialogCancel}
                  disabled={isPending}
                  className="flex-1 px-4 py-2 rounded-lg border border-[rgba(51,51,51,0.6)] text-sm text-[#888899] hover:bg-[rgba(51,51,51,0.2)] transition-colors disabled:opacity-40"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPayout}
                  disabled={isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[rgba(0,255,65,0.15)] border border-[rgba(0,255,65,0.4)] text-sm text-[#00FF41] hover:bg-[rgba(0,255,65,0.25)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>A processar...</span>
                    </>
                  ) : (
                    'Confirmar'
                  )}
                </button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
