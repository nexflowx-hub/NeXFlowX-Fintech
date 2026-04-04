'use client';

import { useState, useCallback } from 'react';
import { ArrowLeftRight, ArrowUpDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSwap } from '@/hooks/use-wallets';
import type { SwapResponse } from '@/lib/api/contracts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// ─── Constants ──────────────────────────────────────────────────────────────

const CURRENCIES = ['EUR', 'USDT', 'GBP', 'USD'] as const;

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  USDT: '₮',
  GBP: '£',
  USD: '$',
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function SwapWidget() {
  const [fromCurrency, setFromCurrency] = useState<string>('EUR');
  const [toCurrency, setToCurrency] = useState<string>('USDT');
  const [amount, setAmount] = useState<string>('');

  const swapMutation = useSwap();

  const isPending = swapMutation.isPending;

  const handleSwapCurrencies = useCallback(() => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  }, [fromCurrency, toCurrency]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const numAmount = parseFloat(amount);
      if (!numAmount || numAmount <= 0) {
        toast.error('Insira um valor válido para a conversão.');
        return;
      }

      if (fromCurrency === toCurrency) {
        toast.error('As moedas de origem e destino devem ser diferentes.');
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
    [amount, fromCurrency, toCurrency, swapMutation],
  );

  const currencySymbol = CURRENCY_SYMBOLS[fromCurrency] ?? '';

  return (
    <div className="cyber-panel p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <ArrowLeftRight className="w-4 h-4 text-[#00F0FF]" />
        <h3 className="text-sm font-semibold text-[#E0E0E8]">Conversão FX</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* From / To Currency Row */}
        <div className="flex items-end gap-2">
          {/* From Currency */}
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs text-[#888899]">De</Label>
            <Select value={fromCurrency} onValueChange={setFromCurrency}>
              <SelectTrigger className="cyber-input w-full rounded-md px-3 py-2 text-sm text-[#E0E0E8]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0F0F14] border-[rgba(51,51,51,0.8)]">
                {CURRENCIES.map((cur) => (
                  <SelectItem key={cur} value={cur} className="text-[#E0E0E8] focus:bg-[rgba(0,255,65,0.08)] focus:text-[#00FF41]">
                    {cur}
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
            <Select value={toCurrency} onValueChange={setToCurrency}>
              <SelectTrigger className="cyber-input w-full rounded-md px-3 py-2 text-sm text-[#E0E0E8]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0F0F14] border-[rgba(51,51,51,0.8)]">
                {CURRENCIES.map((cur) => (
                  <SelectItem key={cur} value={cur} className="text-[#E0E0E8] focus:bg-[rgba(0,255,65,0.08)] focus:text-[#00FF41]">
                    {cur}
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

        {/* Preview Section */}
        <div className="rounded-lg bg-[rgba(10,10,14,0.5)] border border-[rgba(51,51,51,0.3)] p-3 space-y-2">
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
          disabled={isPending || !amount || parseFloat(amount) <= 0}
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
