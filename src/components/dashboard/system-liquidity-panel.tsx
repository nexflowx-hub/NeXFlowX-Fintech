'use client';

import { useMemo } from 'react';
import { Shield, Building2, ArrowLeftRight, Coins, Loader2, AlertTriangle } from 'lucide-react';
import { useAuthStore, isAdmin } from '@/lib/auth-store';
import { useWallets } from '@/hooks/use-wallets';
import type { Wallet, WalletType } from '@/lib/api/contracts';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableFooter,
} from '@/components/ui/table';

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString('pt-BR')}`;
  }
}

// ─── Type Badge ────────────────────────────────────────────────────────────

const walletTypeConfig: Record<
  WalletType,
  { label: string; badgeClass: string }
> = {
  treasury: {
    label: 'Treasury',
    badgeClass: 'cyber-badge cyber-badge-amber',
  },
  fx_pool: {
    label: 'FX Pool',
    badgeClass: 'cyber-badge cyber-badge-cyan',
  },
  merchant: {
    label: 'Merchant',
    badgeClass: 'cyber-badge cyber-badge-green',
  },
  fee: {
    label: 'Fee',
    badgeClass: 'cyber-badge',
  },
};

function WalletTypeBadge({ type }: { type: WalletType }) {
  const cfg = walletTypeConfig[type] ?? walletTypeConfig.merchant;
  return <span className={cfg.badgeClass}>{cfg.label}</span>;
}

// ─── Summary Card ──────────────────────────────────────────────────────────

interface SummaryCardProps {
  label: string;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  iconBg: string;
  items: { currency: string; amount: number }[];
}

function SummaryCard({ label, icon, color, borderColor, iconBg, items }: SummaryCardProps) {
  return (
    <div className={`cyber-panel p-4 border ${borderColor}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${iconBg}`} style={{ color }}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-[#E0E0E8]">{label}</p>
        </div>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-[#555566] cyber-mono">Sem dados disponíveis</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.currency}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-[rgba(10,10,14,0.4)] border border-[rgba(51,51,51,0.3)]"
            >
              <span className="text-xs text-[#888899] cyber-mono">{item.currency}</span>
              <span className="text-sm font-semibold cyber-mono" style={{ color }}>
                {formatCurrency(item.amount, item.currency)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Restricted View ───────────────────────────────────────────────────────

function RestrictedAccess() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="p-4 rounded-full bg-[rgba(255,0,64,0.1)] border border-[rgba(255,0,64,0.2)]">
        <Shield className="w-8 h-8 text-[#FF0040]" />
      </div>
      <p className="text-sm text-[#FF0040] font-medium">Acesso restrito a administradores</p>
      <p className="text-xs text-[#555566] cyber-mono">
        A visão de liquidez do sistema está disponível apenas para administradores.
      </p>
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────

function SkeletonPanel() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={`skeleton-card-${i}`}
            className="cyber-panel p-4 border border-[rgba(51,51,51,0.3)] animate-pulse"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-[rgba(51,51,51,0.4)]" />
              <div className="w-28 h-4 rounded bg-[rgba(51,51,51,0.4)]" />
            </div>
            <div className="space-y-2">
              <div className="w-full h-10 rounded-lg bg-[rgba(51,51,51,0.3)]" />
              <div className="w-full h-10 rounded-lg bg-[rgba(51,51,51,0.3)]" />
            </div>
          </div>
        ))}
      </div>
      <div className="cyber-panel p-4 border border-[rgba(51,51,51,0.3)] animate-pulse">
        <div className="w-48 h-4 rounded bg-[rgba(51,51,51,0.4)] mb-4" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={`skeleton-row-${i}`} className="flex gap-4 py-3">
            <div className="w-20 h-4 rounded bg-[rgba(51,51,51,0.4)]" />
            <div className="w-24 h-4 rounded bg-[rgba(51,51,51,0.4)]" />
            <div className="w-32 h-4 rounded bg-[rgba(51,51,51,0.4)]" />
            <div className="w-32 h-4 rounded bg-[rgba(51,51,51,0.4)]" />
            <div className="w-20 h-4 rounded bg-[rgba(51,51,51,0.4)]" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Clearing Indicator ────────────────────────────────────────────────────

function ClearingIndicator({ total, available }: { total: number; available: number }) {
  const diff = total - available;
  if (Math.abs(diff) < 0.01) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs cyber-mono text-[#555566]">
        <span className="status-dot inactive" style={{ width: '6px', height: '6px' }} />
        0.00
      </span>
    );
  }
  const isClearing = diff > 0;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs cyber-mono ${
        isClearing ? 'text-[#FFB800]' : 'text-[#00FF41]'
      }`}
    >
      <span
        className={`status-dot ${isClearing ? 'warning' : 'active'}`}
        style={{ width: '6px', height: '6px' }}
      />
      {isClearing ? '+' : ''}
      {formatCurrency(diff, 'EUR').replace('€', '').trim()}
    </span>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function SystemLiquidityPanel() {
  const user = useAuthStore((s) => s.user);
  const { data: wallets, isLoading, isError } = useWallets();

  const allWallets: Wallet[] = wallets ?? [];

  const treasuryByCurrency = useMemo(() => {
    const grouped: Record<string, number> = {};
    allWallets
      .filter((w) => w.type === 'treasury')
      .forEach((w) => {
        grouped[w.currency_code] = (grouped[w.currency_code] ?? 0) + w.balance_total;
      });
    return Object.entries(grouped)
      .map(([currency, amount]) => ({ currency, amount }))
      .sort((a, b) => a.currency.localeCompare(b.currency));
  }, [allWallets]);

  const fxPoolByCurrency = useMemo(() => {
    const grouped: Record<string, number> = {};
    allWallets
      .filter((w) => w.type === 'fx_pool')
      .forEach((w) => {
        grouped[w.currency_code] = (grouped[w.currency_code] ?? 0) + w.balance_total;
      });
    return Object.entries(grouped)
      .map(([currency, amount]) => ({ currency, amount }))
      .sort((a, b) => a.currency.localeCompare(b.currency));
  }, [allWallets]);

  const feeByCurrency = useMemo(() => {
    const grouped: Record<string, number> = {};
    allWallets
      .filter((w) => w.type === 'fee')
      .forEach((w) => {
        grouped[w.currency_code] = (grouped[w.currency_code] ?? 0) + w.balance_total;
      });
    return Object.entries(grouped)
      .map(([currency, amount]) => ({ currency, amount }))
      .sort((a, b) => a.currency.localeCompare(b.currency));
  }, [allWallets]);

  const sortedWallets = useMemo(() => {
    return [...allWallets].sort((a, b) => {
      const cmp = a.currency_code.localeCompare(b.currency_code);
      if (cmp !== 0) return cmp;
      return a.type.localeCompare(b.type);
    });
  }, [allWallets]);

  const currencySubtotals = useMemo(() => {
    const totals: Record<string, { total: number; available: number }> = {};
    allWallets.forEach((w) => {
      if (!totals[w.currency_code]) {
        totals[w.currency_code] = { total: 0, available: 0 };
      }
      totals[w.currency_code].total += w.balance_total;
      totals[w.currency_code].available += w.balance_available;
    });
    return totals;
  }, [allWallets]);

  if (!isAdmin(user)) {
    return (
      <div className="cyber-panel p-6">
        <RestrictedAccess />
      </div>
    );
  }

  if (isLoading) {
    return <SkeletonPanel />;
  }

  if (isError || !wallets) {
    return (
      <div className="cyber-panel p-6">
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <AlertTriangle className="w-6 h-6 text-[#FF0040]" />
          <p className="text-sm text-[#FF0040]">
            Não foi possível carregar os dados de liquidez.
          </p>
        </div>
      </div>
    );
  }



  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-5 h-5 text-[#BF40FF]" />
        <h2 className="text-lg font-semibold text-[#E0E0E8]">Liquidez do Sistema</h2>
        <span className="cyber-badge cyber-badge-amber">ADMIN</span>
      </div>

      {/* ── Summary Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          label="Total Treasury"
          icon={<Building2 className="w-4 h-4" />}
          color="#FFB800"
          borderColor="border-[rgba(255,184,0,0.2)]"
          iconBg="bg-[rgba(255,184,0,0.1)]"
          items={treasuryByCurrency}
        />
        <SummaryCard
          label="FX Pool Exposure"
          icon={<ArrowLeftRight className="w-4 h-4" />}
          color="#00F0FF"
          borderColor="border-[rgba(0,240,255,0.2)]"
          iconBg="bg-[rgba(0,240,255,0.1)]"
          items={fxPoolByCurrency}
        />
        <SummaryCard
          label="Total Fees"
          icon={<Coins className="w-4 h-4" />}
          color="#BF40FF"
          borderColor="border-[rgba(191,64,255,0.2)]"
          iconBg="bg-[rgba(191,64,255,0.1)]"
          items={feeByCurrency}
        />
      </div>

      {/* ── Full Wallet Breakdown Table ─────────────────────────────── */}
      <div className="cyber-panel p-4">
        <div className="flex items-center gap-2 mb-4">
          <Loader2 className="w-0 h-0" />
          <h3 className="text-sm font-semibold text-[#E0E0E8]">Carteiras — Detalhe Completo</h3>
          <span className="text-[10px] cyber-mono text-[#555566] ml-auto">
            {allWallets.length} carteira{allWallets.length !== 1 ? 's' : ''}
          </span>
        </div>

        {sortedWallets.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-[#555566] cyber-mono">
              Nenhuma carteira encontrada.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto cyber-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[rgba(51,51,51,0.4)] hover:bg-transparent">
                  <TableHead className="text-[10px] cyber-mono text-[#555566] uppercase tracking-wider">
                    Moeda
                  </TableHead>
                  <TableHead className="text-[10px] cyber-mono text-[#555566] uppercase tracking-wider">
                    Tipo
                  </TableHead>
                  <TableHead className="text-[10px] cyber-mono text-[#555566] uppercase tracking-wider text-right">
                    Saldo Total
                  </TableHead>
                  <TableHead className="text-[10px] cyber-mono text-[#555566] uppercase tracking-wider text-right">
                    Saldo Disponível
                  </TableHead>
                  <TableHead className="text-[10px] cyber-mono text-[#555566] uppercase tracking-wider text-right">
                    Diferença
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedWallets.map((wallet, idx) => {
                  const prevWallet = idx > 0 ? sortedWallets[idx - 1] : null;
                  const showGroupHeader = !prevWallet || wallet.currency_code !== prevWallet.currency_code;

                  return (
                    <TableRow
                      key={`${wallet.id}-${idx}`}
                      className="border-b border-[rgba(51,51,51,0.2)] hover:bg-[rgba(0,255,65,0.02)]"
                    >
                      {showGroupHeader ? (
                        <TableCell className="text-xs font-semibold text-[#E0E0E8] cyber-mono">
                          {wallet.currency_code}
                        </TableCell>
                      ) : (
                        <TableCell className="text-xs text-[#555566] cyber-mono">
                          —
                        </TableCell>
                      )}
                      <TableCell>
                        <WalletTypeBadge type={wallet.type} />
                      </TableCell>
                      <TableCell className="text-xs cyber-mono text-[#E0E0E8] text-right">
                        {formatCurrency(wallet.balance_total, wallet.currency_code)}
                      </TableCell>
                      <TableCell className="text-xs cyber-mono text-[#E0E0E8] text-right">
                        {formatCurrency(wallet.balance_available, wallet.currency_code)}
                      </TableCell>
                      <TableCell className="text-right">
                        <ClearingIndicator
                          total={wallet.balance_total}
                          available={wallet.balance_available}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow className="border-t border-[rgba(51,51,51,0.4)] bg-[rgba(0,255,65,0.02)] hover:bg-[rgba(0,255,65,0.04)]">
                  <TableCell
                    colSpan={2}
                    className="text-xs font-semibold text-[#00FF41] cyber-mono"
                  >
                    SUBTOTALS POR MOEDA
                  </TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell />
                </TableRow>
                {Object.entries(currencySubtotals)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([currency, data]) => (
                    <TableRow
                      key={`subtotal-${currency}`}
                      className="border-t border-[rgba(51,51,51,0.15)] bg-[rgba(0,255,65,0.01)] hover:bg-[rgba(0,255,65,0.03)]"
                    >
                      <TableCell
                        colSpan={2}
                        className="text-xs font-semibold text-[#E0E0E8] cyber-mono py-1"
                      >
                        Total {currency}
                      </TableCell>
                      <TableCell className="text-xs cyber-mono font-semibold text-[#E0E0E8] text-right py-1">
                        {formatCurrency(data.total, currency)}
                      </TableCell>
                      <TableCell className="text-xs cyber-mono font-semibold text-[#E0E0E8] text-right py-1">
                        {formatCurrency(data.available, currency)}
                      </TableCell>
                      <TableCell className="text-right py-1">
                        <ClearingIndicator
                          total={data.total}
                          available={data.available}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableFooter>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
