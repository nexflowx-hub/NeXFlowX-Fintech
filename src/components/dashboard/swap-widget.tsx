'use client';

import { useState, useCallback, useMemo } from 'react';
import { ArrowLeftRight, ArrowUpDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSwap, useWallets } from '@/hooks/use-wallets';
import type { SwapResponse } from '@/lib/api/contracts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// ─── Helpers ────────────────────────────────────────────────────────────────

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  USDT: '₮',
  GBP: '£',
  USD: '$',
  BRL: 'R$',
  BTC: '₿',
  ETH: 'Ξ',
};

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString('pt-BR')}`;
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function SwapWidget() {
  const { data: wallets } = useWallets();

  // Extract unique currency codes from MERCHANT wallets only (prevents 400 errors from backend)
  const availableCurrencies = useMemo(() => {
    if (!wallets || wallets.length === 0) return [];
    const map = new Map<string, number>();
    for (const w of wallets) {
      // Only merchant wallet types — treasury/fee/fx_pool currencies cannot be used for swap
      if (w.type === 'merchant' && w.currency_code) {
        map.set(w.currency_code, (map.get(w.currency_code) ?? 0) + w.balance_available);
      }
    }
    return Array.from(map.entries()).map(([code, balance]) => ({ code, balance }));
  }, [wallets]);

  // null = not yet manually selected → derive from available merchant currencies
  const [userFrom, setUserFrom] = useState<string | null>(null);
  const [userTo, setUserTo] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>('');

  // Derive effective selections: manual override or first two from merchant wallets
  const fromCurrency = userFrom ?? (availableCurrencies[0]?.code ?? '');
  const toCurrency = userTo ?? (availableCurrencies.length >= 2 ? availableCurrencies[1].code : (availableCurrencies[0]?.code ?? ''));

  // Helper: get balance for a currency
  const getBalance = useCallback((code: string) => {
    return availableCurrencies.find((c) => c.code === code)?.balance ?? 0;
  }, [availableCurrencies]);

  const swapMutation = useSwap();
  const isPending = swapMutation.isPending;

  const currencySymbol = CURRENCY_SYMBOLS[fromCurrency] ?? '';

  const handleSwapCurrencies = useCallback(() => {
    setUserFrom(toCurrency);
    setUserTo(fromCurrency);
  }, [fromCurrency, toCurrency]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const numAmount = parseFloat(amount);
      if (!numAmount || numAmount <= 0) {
        toast.error('Insira um valor válido para a conversão.');
        return;
      }

      if (!fromCurrency || !toCurrency) {
        toast.error('Selecione as moedas de origem e destino.');
        return;
      }

      if (fromCurrency === toCurrency) {
        toast.error('As moedas de origem e destino devem ser diferentes.');
        return;
      }

      // Validate that user has sufficient balance
      const available = getBalance(fromCurrency);
      if (numAmount > available) {
        toast.error(`Saldo insuficiente. Disponível: ${formatCurrency(available, fromCurrency)}`);
        return;
      }

      swapMutation.mutate(
        {
          amount: numAmount,
          from_currency: fromCurrency,
          to_currency: toCurrency,
        },
        {
          onSuccess: (data: SwapResponse) => {
            toast.success(
              `Swap executado com sucesso! Convertido: ${data.converted ?? '—'}`,
            );
            setAmount('');
          },
          onError: (err: Error) => {
            toast.error(err.message || 'Erro ao executar swap. Tente novamente.');
          },
        },
      );
    },
    [amount, fromCurrency, toCurrency, swapMutation, getBalance],
  );

  // No wallets loaded yet
  if (!wallets) {
    return (
      <div className="cyber-panel p-5">
        <div className="flex items-center gap-2 mb-5">
          <ArrowLeftRight className="w-4 h-4 text-[#00F0FF]" />
          <h3 className="text-sm font-semibold text-[#E0E0E8]">Conversão FX</h3>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 text-[#00F0FF] animate-spin" />
          <span className="ml-3 text-xs cyber-mono text-[#555566]">
            A CARREGAR CARTEIRAS...
          </span>
        </div>
      </div>
    );
  }

  // No merchant currencies available
  if (availableCurrencies.length === 0) {
    return (
      <div className="cyber-panel p-5">
        <div className="flex items-center gap-2 mb-5">
          <ArrowLeftRight className="w-4 h-4 text-[#00F0FF]" />
          <h3 className="text-sm font-semibold text-[#E0E0E8]">Conversão FX</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-xs text-[#555566] cyber-mono">
            Nenhuma carteira merchant disponível para fazer swap.
          </p>
          <p className="text-[10px] text-[#444455] cyber-mono mt-1">
            Efetue um depósito primeiro para começar.
          </p>
        </div>
      </div>
    );
  }

  // Need at least 2 currencies for a meaningful swap
  if (availableCurrencies.length < 2) {
    return (
      <div className="cyber-panel p-5">
        <div className="flex items-center gap-2 mb-5">
          <ArrowLeftRight className="w-4 h-4 text-[#00F0FF]" />
          <h3 className="text-sm font-semibold text-[#E0E0E8]">Conversão FX</h3>
          <span className="cyber-badge cyber-badge-amber text-[9px] ml-auto">
            1 moeda
          </span>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-xs text-[#555566] cyber-mono">
            Necessita de pelo menos 2 moedas na carteira merchant para fazer swap.
          </p>
          <p className="text-[10px] text-[#444455] cyber-mono mt-1">
            Disponível: {availableCurrencies[0]?.code} ({formatCurrency(availableCurrencies[0]?.balance ?? 0, availableCurrencies[0]?.code ?? 'EUR')})
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="cyber-panel p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <ArrowLeftRight className="w-4 h-4 text-[#00F0FF]" />
        <h3 className="text-sm font-semibold text-[#E0E0E8]">Conversão FX</h3>
        <span className="cyber-badge cyber-badge-cyan text-[9px] ml-auto">
          {availableCurrencies.length} moeda{availableCurrencies.length !== 1 ? 's' : ''} (merchant)
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* From / To Currency Row */}
        <div className="flex items-end gap-2">
          {/* From Currency */}
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs text-[#888899]">De</Label>
            <Select value={fromCurrency} onValueChange={setUserFrom}>
              <SelectTrigger className="cyber-input w-full rounded-md px-3 py-2 text-sm text-[#E0E0E8]">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent className="bg-[#0F0F14] border-[rgba(51,51,51,0.8)]">
                {availableCurrencies.map((cur) => (
                  <SelectItem key={cur.code} value={cur.code} className="text-[#E0E0E8] focus:bg-[rgba(0,255,65,0.08)] focus:text-[#00FF41]">
                    <span className="flex items-center justify-between gap-4 w-full">
                      <span>{cur.code}</span>
                      <span className="text-[10px] text-[#555566]">{formatCurrency(cur.balance, cur.code)}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Swap Direction Button */}
          <button
            type="button"
            onClick={handleSwapCurrencies}
            className="mb-0.5 p-2 rounded-lg border border-[rgba(0,240,255,0.3)] text-[#00F0FF] hover:bg-[rgba(0,240,255,0.1)] transition-colors"
            title="Inverter moedas"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>

          {/* To Currency */}
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs text-[#888899]">Para</Label>
            <Select value={toCurrency} onValueChange={setUserTo}>
              <SelectTrigger className="cyber-input w-full rounded-md px-3 py-2 text-sm text-[#E0E0E8]">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent className="bg-[#0F0F14] border-[rgba(51,51,51,0.8)]">
                {availableCurrencies.map((cur) => (
                  <SelectItem key={cur.code} value={cur.code} className="text-[#E0E0E8] focus:bg-[rgba(0,255,65,0.08)] focus:text-[#00FF41]">
                    <span className="flex items-center justify-between gap-4 w-full">
                      <span>{cur.code}</span>
                      <span className="text-[10px] text-[#555566]">{formatCurrency(cur.balance, cur.code)}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

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

        {/* Preview Section with Balance */}
        <div className="rounded-lg bg-[rgba(10,10,14,0.5)] border border-[rgba(51,51,51,0.3)] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#555566]">Disponível ({fromCurrency})</span>
            <span className="text-xs text-[#00FF41] cyber-mono font-semibold">
              {formatCurrency(getBalance(fromCurrency), fromCurrency)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#555566]">Estimativa de conversão</span>
            <span className="text-xs text-[#888899] cyber-mono">---</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#555566]">Taxa de serviço</span>
            <span className="text-xs text-[#FFB800] cyber-mono">0.50%</span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending || !amount || parseFloat(amount) <= 0 || !fromCurrency || !toCurrency}
          className="cyber-btn-primary w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>A processar...</span>
            </>
          ) : (
            'Executar Swap'
          )}
        </button>
      </form>
    </div>
  );
}
