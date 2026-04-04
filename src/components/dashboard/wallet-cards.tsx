'use client';

import { useMemo } from 'react';
import { AlertTriangle, RefreshCw, Wallet, CircleDollarSign } from 'lucide-react';
import { useWallets } from '@/hooks/use-wallets';
import type { Wallet as WalletType } from '@/lib/api/contracts';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString('pt-BR')}`;
  }
}

const CURRENCY_FLAGS: Record<string, string> = {
  EUR: '🇪🇺',
  USDT: '💎',
  GBP: '🇬🇧',
  USD: '🇺🇸',
  BRL: '🇧🇷',
};

const WALLET_TYPE_BADGE: Record<string, { label: string; classes: string }> = {
  merchant: { label: 'Merchant', classes: 'cyber-badge-green' },
  treasury: { label: 'Treasury', classes: 'cyber-badge-amber' },
  fee: { label: 'Fee', classes: 'bg-[rgba(191,64,255,0.1)] text-[#BF40FF] border border-[rgba(191,64,255,0.3)]' },
  fx_pool: { label: 'FX Pool', classes: 'cyber-badge-cyan' },
};

// ─── Skeleton Card ──────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="cyber-panel p-5 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-[rgba(51,51,51,0.4)]" />
        <div className="w-16 h-5 rounded bg-[rgba(51,51,51,0.4)]" />
      </div>
      <div className="w-24 h-3 rounded bg-[rgba(51,51,51,0.4)] mb-3" />
      <div className="w-36 h-8 rounded bg-[rgba(51,51,51,0.4)] mb-2" />
      <div className="w-28 h-3 rounded bg-[rgba(51,51,51,0.3)]" />
    </div>
  );
}

// ─── Wallet Card ────────────────────────────────────────────────────────────

interface WalletCardProps {
  wallet: WalletType;
}

function WalletCard({ wallet }: WalletCardProps) {
  const flag = CURRENCY_FLAGS[wallet.currency_code] ?? '🌐';
  const badge = WALLET_TYPE_BADGE[wallet.type] ?? { label: wallet.type, classes: 'cyber-badge-green' };
  const hasClearing = wallet.balance_total > 0 && wallet.balance_available < wallet.balance_total;
  const clearingAmount = hasClearing ? wallet.balance_total - wallet.balance_available : 0;
  const availableRatio = wallet.balance_total > 0 ? (wallet.balance_available / wallet.balance_total) * 100 : 100;

  return (
    <div className="cyber-panel p-5 flex flex-col gap-3">
      {/* Header: flag + currency code + badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{flag}</span>
          <span className="text-lg font-bold text-[#E0E0E8] cyber-mono">{wallet.currency_code}</span>
        </div>
        <span className={`cyber-badge ${badge.classes}`}>{badge.label}</span>
      </div>

      {/* Available balance — PRIMARY NUMBER */}
      <div>
        <p className="text-[10px] text-[#555566] uppercase tracking-wider mb-1">Disponível</p>
        <p className="text-2xl font-bold text-[#00FF41] neon-glow-green cyber-mono">
          {formatCurrency(wallet.balance_available, wallet.currency_code)}
        </p>
      </div>

      {/* Total balance — subtle */}
      <p className="text-xs text-[#555566] cyber-mono">
        Total: {formatCurrency(wallet.balance_total, wallet.currency_code)}
      </p>

      {/* Clearing visualization */}
      {hasClearing && (
        <div className="space-y-2 pt-1">
          <div className="neon-progress-bar h-2">
            <div
              className="neon-progress-fill amber"
              style={{ width: `${availableRatio}%` }}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="cyber-badge cyber-badge-amber">Funds in clearing</span>
            <span className="text-xs text-[#FFB800] cyber-mono">
              {formatCurrency(clearingAmount, wallet.currency_code)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function WalletCards() {
  const { data: wallets, isLoading, isError, error, refetch } = useWallets();

  const summary = useMemo(() => {
    if (!wallets || wallets.length === 0) {
      return { totalAvailable: 0, totalWallets: 0 };
    }
    const totalAvailable = wallets.reduce((sum, w) => sum + w.balance_available, 0);
    return {
      totalAvailable,
      totalWallets: wallets.length,
    };
  }, [wallets]);

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Summary skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="cyber-panel p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[rgba(51,51,51,0.4)]" />
              <div>
                <div className="w-28 h-3 rounded bg-[rgba(51,51,51,0.4)] mb-2" />
                <div className="w-40 h-6 rounded bg-[rgba(51,51,51,0.4)]" />
              </div>
            </div>
          </div>
          <div className="cyber-panel p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[rgba(51,51,51,0.4)]" />
              <div>
                <div className="w-24 h-3 rounded bg-[rgba(51,51,51,0.4)] mb-2" />
                <div className="w-12 h-6 rounded bg-[rgba(51,51,51,0.4)]" />
              </div>
            </div>
          </div>
        </div>
        {/* Card skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={`skeleton-${i}`} />
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (isError) {
    return (
      <div className="cyber-panel p-6 border border-[rgba(255,0,64,0.2)] flex flex-col items-center justify-center gap-4 min-h-[200px]">
        <AlertTriangle className="w-8 h-8 text-[#FF0040]" />
        <div className="text-center">
          <p className="text-sm text-[#FF0040] mb-1">Erro ao carregar carteiras</p>
          <p className="text-xs text-[#555566]">
            {error instanceof Error ? error.message : 'Erro desconhecido. Tente novamente.'}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[rgba(0,255,65,0.3)] text-[#00FF41] text-xs hover:bg-[rgba(0,255,65,0.1)] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Summary Stats ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="cyber-panel p-4 border border-[rgba(0,255,65,0.15)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[rgba(0,255,65,0.1)]">
              <CircleDollarSign className="w-5 h-5 text-[#00FF41]" />
            </div>
            <div>
              <p className="text-xs text-[#555566] uppercase tracking-wider">Total Disponível</p>
              <p className="text-xl font-bold text-[#00FF41] neon-glow-green cyber-mono">
                {formatCurrency(summary.totalAvailable, 'EUR')}
              </p>
            </div>
          </div>
        </div>
        <div className="cyber-panel p-4 border border-[rgba(0,240,255,0.15)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[rgba(0,240,255,0.1)]">
              <Wallet className="w-5 h-5 text-[#00F0FF]" />
            </div>
            <div>
              <p className="text-xs text-[#555566] uppercase tracking-wider">Total Carteiras</p>
              <p className="text-xl font-bold text-[#00F0FF] neon-glow-cyan cyber-mono">
                {summary.totalWallets}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Wallet Cards Grid ─────────────────────────────────────── */}
      {wallets && wallets.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {wallets.map((wallet) => (
            <WalletCard key={wallet.id} wallet={wallet} />
          ))}
        </div>
      ) : (
        <div className="cyber-panel p-8 flex flex-col items-center justify-center min-h-[200px]">
          <Wallet className="w-8 h-8 text-[#555566] mb-3" />
          <p className="text-sm text-[#555566] cyber-mono">Nenhuma carteira encontrada</p>
        </div>
      )}
    </div>
  );
}
