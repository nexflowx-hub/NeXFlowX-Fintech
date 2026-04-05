'use client';

import { useMemo } from 'react';
import {
  Wallet,
  Landmark,
  Clock,
  CreditCard,
  ArrowLeftRight,
  Banknote,
  List,
  AlertTriangle,
  ArrowUpRight,
  PlusCircle,
} from 'lucide-react';
import { useWallets, useLedger } from '@/hooks/use-wallets';
import type { LedgerEntry, LedgerEntryType, LedgerEntryStatus } from '@/lib/api/contracts';
import { useDashboardStore } from '@/lib/dashboard-store';
import { Skeleton } from '@/components/ui/skeleton';

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency: string = 'EUR'): string {
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString('pt-BR')}`;
  }
}

function formatTimestamp(ts: string): string {
  try {
    return new Date(ts).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

const TYPE_BADGE_MAP: Record<
  LedgerEntryType,
  { label: string; className: string; style?: React.CSSProperties }
> = {
  PAYIN: { label: 'PAYIN', className: 'cyber-badge cyber-badge-green' },
  SWAP: { label: 'SWAP', className: 'cyber-badge cyber-badge-cyan' },
  PAYOUT: { label: 'PAYOUT', className: 'cyber-badge cyber-badge-amber' },
  FEE: {
    label: 'FEE',
    className: 'cyber-badge',
    style: {
      background: 'rgba(191, 64, 255, 0.1)',
      color: '#BF40FF',
      border: '1px solid rgba(191, 64, 255, 0.3)',
    },
  },
  REFUND: { label: 'REFUND', className: 'cyber-badge cyber-badge-red' },
};

const STATUS_DOT_MAP: Record<
  LedgerEntryStatus,
  { dotClass: string; label: string }
> = {
  cleared: { dotClass: 'status-dot active', label: 'Cleared' },
  pending: { dotClass: 'status-dot warning', label: 'Pending' },
  failed: { dotClass: 'status-dot error', label: 'Failed' },
};

// ─── Stat Card ─────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  iconBg: string;
}

function StatCard({ label, value, icon, color, borderColor, iconBg }: StatCardProps) {
  return (
    <div className={`cyber-panel p-4 border ${borderColor}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${iconBg}`} style={{ color }}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-[#E0E0E8] cyber-mono">{value}</p>
      <p className="text-xs text-[#555566] mt-1">{label}</p>
    </div>
  );
}

// ─── Quick Action Card ─────────────────────────────────────────────────────

interface QuickActionCardProps {
  label: string;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  iconBg: string;
  onClick: () => void;
}

function QuickActionCard({
  label,
  icon,
  color,
  borderColor,
  iconBg,
  onClick,
}: QuickActionCardProps) {
  return (
    <button
      onClick={onClick}
      className={`cyber-panel p-4 border ${borderColor} text-left
        hover:border-opacity-60 transition-all duration-200 group w-full`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${iconBg}`} style={{ color }}>
          {icon}
        </div>
        <ArrowUpRight
          className="w-4 h-4 text-[#555566] opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color }}
        />
      </div>
      <p className="text-sm font-semibold text-[#E0E0E8]">{label}</p>
    </button>
  );
}

// ─── Ledger Entry Row (compact) ────────────────────────────────────────────

function LedgerEntryRow({ entry }: { entry: LedgerEntry }) {
  const badge = TYPE_BADGE_MAP[entry.type];
  const statusCfg = STATUS_DOT_MAP[entry.status];
  const isNeg = entry.type === 'FEE' || entry.type === 'REFUND';
  const displayAmount = isNeg ? Math.abs(entry.amount) : entry.amount;

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg
        bg-[rgba(10,10,14,0.4)] border border-[rgba(51,51,51,0.3)]
        hover:border-[rgba(51,51,51,0.6)] transition-colors"
    >
      {/* Type badge */}
      <span className={badge.className} style={badge.style}>
        {badge.label}
      </span>

      {/* Status dot */}
      <span className={statusCfg.dotClass} />

      {/* Amount */}
      <span
        className="cyber-mono text-xs font-semibold flex-shrink-0"
        style={{ color: isNeg ? '#FF0040' : '#E0E0E8' }}
      >
        {isNeg ? '-' : ''}
        {formatCurrency(displayAmount, entry.currency)}
      </span>

      {/* Currency */}
      <span className="text-[10px] text-[#555566] cyber-mono flex-shrink-0">
        {entry.currency}
      </span>

      {/* Description */}
      <span className="text-xs text-[#888899] flex-1 truncate">
        {entry.description || entry.reference || '—'}
      </span>

      {/* Date */}
      <span className="text-[10px] text-[#555566] cyber-mono flex-shrink-0">
        {formatTimestamp(entry.created_at)}
      </span>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function DashboardOverview() {
  const { setActiveSection } = useDashboardStore();
  const { data: wallets, isLoading: walletsLoading, isError: walletsError, refetch: refetchWallets } = useWallets();
  const { data: ledgerRes, isLoading: ledgerLoading, isError: ledgerError } = useLedger({ limit: '10' });

  const isLoading = walletsLoading || ledgerLoading;
  const isError = walletsError || ledgerError;
  const refetch = () => { refetchWallets(); };

  const entries = ledgerRes?.data ?? [];
  const walletList = wallets ?? [];

  // ── Derived stats (per-currency, avoids magic sum across currencies) ──
  const currencyStats = useMemo(() => {
    if (walletList.length === 0) return [];
    const map = new Map<string, number>();
    for (const w of walletList) {
      map.set(w.currency_code, (map.get(w.currency_code) ?? 0) + w.balance_available);
    }
    return Array.from(map.entries()).map(([currency, available]) => ({ currency, available }));
  }, [walletList]);

  const activeWallets = walletList.length;

  return (
    <div className="space-y-6">
      {/* ═══ Section 1 — Summary Stats ═════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={`skel-stat-${i}`}
              className="cyber-panel p-4 border border-[rgba(51,51,51,0.3)] animate-pulse"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-[rgba(51,51,51,0.4)]" />
              </div>
              <div className="w-28 h-7 rounded bg-[rgba(51,51,51,0.4)] mb-2" />
              <div className="w-36 h-3 rounded bg-[rgba(51,51,51,0.3)]" />
            </div>
          ))
        ) : isError ? (
          <div className="col-span-1 sm:col-span-2 lg:col-span-4 cyber-panel p-4 border border-[rgba(255,0,64,0.2)] flex items-center justify-center gap-3">
            <AlertTriangle className="w-5 h-5 text-[#FF0040]" />
            <span className="text-sm text-[#FF0040]">
              Não foi possível carregar os dados do dashboard.
            </span>
            <button
              onClick={refetch}
              className="ml-2 text-xs px-3 py-1 rounded border border-[rgba(0,255,65,0.3)] text-[#00FF41] hover:bg-[rgba(0,255,65,0.1)] transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <>
            {/* Per-currency balance cards */}
            {currencyStats.map(({ currency, available }) => (
              <StatCard
                key={currency}
                label={`Disponível ${currency}`}
                value={formatCurrency(available, currency)}
                icon={<Wallet className="w-4 h-4" />}
                color="#00FF41"
                borderColor="border-[rgba(0,255,65,0.2)]"
                iconBg="bg-[rgba(0,255,65,0.1)]"
              />
            ))}

            {/* Carteiras Ativas */}
            <StatCard
              label="Carteiras Ativas"
              value={String(activeWallets)}
              icon={<CreditCard className="w-4 h-4" />}
              color="#BF40FF"
              borderColor="border-[rgba(191,64,255,0.2)]"
              iconBg="bg-[rgba(191,64,255,0.1)]"
            />
          </>
        )}
      </div>

      {/* ═══ Section 2 — Quick Actions ═════════════════════════════ */}
      {!isLoading && !isError && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard
            label="Depositar"
            icon={<PlusCircle className="w-5 h-5" />}
            color="#FF6B35"
            borderColor="border-[rgba(255,107,53,0.2)]"
            iconBg="bg-[rgba(255,107,53,0.1)]"
            onClick={() => setActiveSection('deposits')}
          />
          <QuickActionCard
            label="Converter Moeda"
            icon={<ArrowLeftRight className="w-5 h-5" />}
            color="#00F0FF"
            borderColor="border-[rgba(0,240,255,0.2)]"
            iconBg="bg-[rgba(0,240,255,0.1)]"
            onClick={() => setActiveSection('swap')}
          />
          <QuickActionCard
            label="Solicitar Levantamento"
            icon={<Banknote className="w-5 h-5" />}
            color="#FFB800"
            borderColor="border-[rgba(255,184,0,0.2)]"
            iconBg="bg-[rgba(255,184,0,0.1)]"
            onClick={() => setActiveSection('payouts')}
          />
          <QuickActionCard
            label="Ver Atividade"
            icon={<List className="w-5 h-5" />}
            color="#00FF41"
            borderColor="border-[rgba(0,255,65,0.2)]"
            iconBg="bg-[rgba(0,255,65,0.1)]"
            onClick={() => setActiveSection('activity')}
          />
        </div>
      )}

      {/* ═══ Section 3 — Recent Activity ══════════════════════════ */}
      <div className="cyber-panel p-4 border border-[rgba(51,51,51,0.6)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <List className="w-4 h-4 text-[#00FF41]" />
            <h3 className="text-sm font-semibold text-[#E0E0E8]">
              Atividade Recente
            </h3>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded cyber-badge-green cyber-badge">
            <span className="status-dot active" style={{ width: '6px', height: '6px' }} />
            <span>LIVE</span>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={`skel-activity-${i}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg animate-pulse"
              >
                <Skeleton className="h-5 w-14 rounded" />
                <Skeleton className="h-2 w-2 rounded-full" />
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-4 w-10 rounded" />
                <Skeleton className="h-4 flex-1 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <span className="text-xs text-[#555566] cyber-mono">
              Nenhuma atividade recente
            </span>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto cyber-scrollbar pr-1">
            {entries.map((entry) => (
              <LedgerEntryRow key={entry.id} entry={entry} />
            ))}
          </div>
        )}

        {/* Link to full activity */}
        {!isLoading && !isError && (
          <div className="mt-4 pt-3 border-t border-[rgba(51,51,51,0.4)]">
            <button
              onClick={() => setActiveSection('activity')}
              className="text-xs text-[#00FF41] hover:text-[#00FF41]/80 cyber-mono
                flex items-center gap-1 transition-colors group"
            >
              Ver toda a atividade
              <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
