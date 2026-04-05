'use client';

import { useState, useCallback, useMemo } from 'react';
import { Plus, ExternalLink, Copy, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useDeposit, useWallets } from '@/hooks/use-wallets';
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

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString('pt-BR')}`;
  }
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '\u20AC',
  USDT: '\u20AE',
  GBP: '\u00A3',
  USD: '$',
  BRL: 'R$',
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function DepositWidget() {
  const { data: wallets } = useWallets();

  // Extract unique currency codes from MERCHANT wallets only (prevents 400 errors)
  const availableCurrencies = useMemo(() => {
    if (!wallets || wallets.length === 0) return [];
    const map = new Map<string, number>();
    for (const w of wallets) {
      // Only merchant wallet types
      if (w.type === 'merchant' && w.currency_code) {
        map.set(w.currency_code, (map.get(w.currency_code) ?? 0) + w.balance_available);
      }
    }
    return Array.from(map.entries()).map(([code, balance]) => ({ code, balance }));
  }, [wallets]);

  const [amount, setAmount] = useState<string>('');
  // null = not yet manually selected → derive from available currencies
  const [userCurrency, setUserCurrency] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [shareableUrl, setShareableUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const depositMutation = useDeposit();
  const isPending = depositMutation.isPending;

  // Derive effective currency: manual override or first from merchant wallets
  const currency = userCurrency ?? (availableCurrencies[0]?.code ?? '');

  const currencySymbol = CURRENCY_SYMBOLS[currency] ?? '';

  const numAmount = parseFloat(amount) || 0;
  const formIsValid = numAmount > 0;

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!formIsValid) {
        toast.error('Insira um valor válido para o depósito.');
        return;
      }

      if (!currency) {
        toast.error('Selecione a moeda para o depósito.');
        return;
      }

      depositMutation.mutate(
        { amount: numAmount, currency },
        {
          onSuccess: (data) => {
            const url = data?.data?.shareable_url ?? '';
            setShareableUrl(url);
            setDialogOpen(true);
            toast.success('Link de pagamento gerado com sucesso!');
            setAmount('');
          },
          onError: (err: Error) => {
            toast.error(err.message || 'Erro ao gerar link de pagamento. Tente novamente.');
          },
        },
      );
    },
    [depositMutation, numAmount, currency, formIsValid],
  );

  const handleCopyLink = useCallback(async () => {
    if (!shareableUrl) return;
    try {
      await navigator.clipboard.writeText(shareableUrl);
      setCopied(true);
      toast.success('Link copiado para a área de transferência!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Não foi possível copiar o link.');
    }
  }, [shareableUrl]);

  const handleDialogClose = useCallback((open: boolean) => {
    if (!open) {
      setShareableUrl('');
      setCopied(false);
    }
    setDialogOpen(open);
  }, []);

  // No wallets loaded yet
  if (!wallets) {
    return (
      <div className="cyber-panel p-5">
        <div className="flex items-center gap-2 mb-5">
          <Plus className="w-4 h-4 text-[#00FF41]" />
          <h3 className="text-sm font-semibold text-[#E0E0E8]">Depósito</h3>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 text-[#00FF41] animate-spin" />
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
          <Plus className="w-4 h-4 text-[#00FF41]" />
          <h3 className="text-sm font-semibold text-[#E0E0E8]">Depósito</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending || !formIsValid || !currency}
            className="cyber-btn-primary w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>A gerar link...</span>
              </>
            ) : (
              'Gerar Link de Pagamento'
            )}
          </button>
        </form>
      </div>

      {/* ── Success Dialog ──────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="bg-[#0F0F14] border-[rgba(51,51,51,0.8)] sm:max-w-md">
          <DialogHeader className="items-center text-center pt-4">
            <CheckCircle2 className="w-12 h-12 text-[#00FF41] mb-3 mx-auto" />
            <DialogTitle className="text-[#00FF41] text-lg">
              Link de pagamento gerado
            </DialogTitle>
            <DialogDescription className="text-[#888899] text-sm mt-2">
              Partilhe este link com o cliente para receber o pagamento.
            </DialogDescription>
          </DialogHeader>

          {/* URL Display */}
          <div className="rounded-lg bg-[rgba(10,10,14,0.5)] border border-[rgba(51,51,51,0.3)] p-3">
            <p className="text-xs text-[#555566] cyber-mono mb-1.5 uppercase">Link de pagamento</p>
            <p className="text-sm text-[#00F0FF] cyber-mono break-all select-all">
              {shareableUrl}
            </p>
          </div>

          <DialogFooter className="gap-2 sm:justify-center">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[rgba(0,240,255,0.1)] border border-[rgba(0,240,255,0.3)] text-sm text-[#00F0FF] hover:bg-[rgba(0,240,255,0.2)] transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Link</span>
                </>
              )}
            </button>
            <a
              href={shareableUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[rgba(0,255,65,0.15)] border border-[rgba(0,255,65,0.4)] text-sm text-[#00FF41] hover:bg-[rgba(0,255,65,0.25)] transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Abrir</span>
            </a>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
