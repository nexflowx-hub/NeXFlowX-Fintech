'use client';

import { useState, useCallback } from 'react';
import { Plus, ExternalLink, Copy, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useDeposit } from '@/hooks/use-wallets';
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

const CURRENCIES = ['EUR', 'USDT'] as const;

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '\u20AC',
  USDT: '\u20AE',
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function DepositWidget() {
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<string>('EUR');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [shareableUrl, setShareableUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const depositMutation = useDeposit();
  const isPending = depositMutation.isPending;

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

          {/* Currency */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[#888899]">Moeda</Label>
            <Select value={currency} onValueChange={setCurrency}>
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending || !formIsValid}
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
