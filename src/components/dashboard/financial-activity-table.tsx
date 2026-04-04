'use client';

import { useState, useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useLedger } from '@/hooks/use-wallets';
import type { LedgerEntryType, LedgerEntryStatus } from '@/lib/api/contracts';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

function formatLedgerDate(ts: string): string {
  try {
    return new Date(ts).toLocaleDateString('pt-BR');
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

const NEGATIVE_TYPES = new Set<LedgerEntryType>(['FEE', 'REFUND']);

// ─── Skeleton Rows ─────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableRow key={`skel-${i}`}>
          <TableCell>
            <Skeleton className="h-5 w-16 rounded" />
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <Skeleton className="h-2 w-2 rounded-full" />
              <Skeleton className="h-4 w-14 rounded" />
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24 rounded" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-10 rounded" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-36 rounded" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24 rounded" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function FinancialActivityTable() {
  const { data: ledgerRes, isLoading, isError, refetch } = useLedger();
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const entries = ledgerRes?.data ?? [];

  // ── Client-side filtering ──
  const filtered = useMemo(() => {
    return entries.filter((entry) => {
      if (typeFilter !== 'ALL' && entry.type !== typeFilter) return false;
      if (statusFilter !== 'ALL' && entry.status !== statusFilter) return false;
      return true;
    });
  }, [entries, typeFilter, statusFilter]);

  // ── Summary stats ──
  const summary = useMemo(() => {
    const totalEntries = entries.length;
    const totalVolume = entries
      .filter((e) => e.status === 'cleared')
      .reduce((sum, e) => sum + e.amount, 0);
    return { totalEntries, totalVolume };
  }, [entries]);

  // ── Render helpers ──
  const renderAmount = (entry: (typeof entries)[0]) => {
    const isNeg = NEGATIVE_TYPES.has(entry.type);
    const displayAmount = isNeg ? Math.abs(entry.amount) : entry.amount;
    const formatted = formatCurrency(displayAmount, entry.currency);
    return (
      <span
        className="cyber-mono text-sm"
        style={{ color: isNeg ? '#FF0040' : '#E0E0E8' }}
      >
        {isNeg ? '-' : ''}
        {formatted}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <Tabs defaultValue="ledger">
        <TabsList className="bg-[rgba(25,25,35,0.6)] border border-[rgba(51,51,51,0.6)]">
          <TabsTrigger
            value="ledger"
            className="data-[state=active]:text-[#00FF41] data-[state=active]:border-[rgba(0,255,65,0.3)] text-[#888899]"
          >
            Ledger
          </TabsTrigger>
          <TabsTrigger
            value="events"
            className="data-[state=active]:text-[#00F0FF] data-[state=active]:border-[rgba(0,240,255,0.3)] text-[#888899]"
          >
            Payment Events
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: Ledger ─────────────────────────────────────────── */}
        <TabsContent value="ledger" className="mt-4">
          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#555566] cyber-mono">TIPO</span>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[130px] cyber-input text-xs h-8 border-[rgba(51,51,51,0.8)] bg-[rgba(10,10,14,0.6)] text-[#E0E0E8]">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="bg-[rgba(15,15,20,0.95)] border-[rgba(51,51,51,0.6)]">
                  <SelectItem value="ALL" className="text-[#E0E0E8] focus:bg-[rgba(0,255,65,0.08)] focus:text-[#00FF41]">
                    Todos
                  </SelectItem>
                  <SelectItem value="PAYIN" className="text-[#00FF41] focus:bg-[rgba(0,255,65,0.08)]">
                    PAYIN
                  </SelectItem>
                  <SelectItem value="SWAP" className="text-[#00F0FF] focus:bg-[rgba(0,240,255,0.08)]">
                    SWAP
                  </SelectItem>
                  <SelectItem value="PAYOUT" className="text-[#FFB800] focus:bg-[rgba(255,184,0,0.08)]">
                    PAYOUT
                  </SelectItem>
                  <SelectItem value="FEE" className="text-[#BF40FF] focus:bg-[rgba(191,64,255,0.08)]">
                    FEE
                  </SelectItem>
                  <SelectItem value="REFUND" className="text-[#FF0040] focus:bg-[rgba(255,0,64,0.08)]">
                    REFUND
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#555566] cyber-mono">STATUS</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px] cyber-input text-xs h-8 border-[rgba(51,51,51,0.8)] bg-[rgba(10,10,14,0.6)] text-[#E0E0E8]">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="bg-[rgba(15,15,20,0.95)] border-[rgba(51,51,51,0.6)]">
                  <SelectItem value="ALL" className="text-[#E0E0E8] focus:bg-[rgba(0,255,65,0.08)] focus:text-[#00FF41]">
                    Todos
                  </SelectItem>
                  <SelectItem value="pending" className="text-[#FFB800] focus:bg-[rgba(255,184,0,0.08)]">
                    Pending
                  </SelectItem>
                  <SelectItem value="cleared" className="text-[#00FF41] focus:bg-[rgba(0,255,65,0.08)]">
                    Cleared
                  </SelectItem>
                  <SelectItem value="failed" className="text-[#FF0040] focus:bg-[rgba(255,0,64,0.08)]">
                    Failed
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Summary stats */}
            <div className="flex items-center gap-4 ml-auto">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-[#555566] cyber-mono uppercase">Entradas</span>
                <span className="text-xs text-[#E0E0E8] cyber-mono font-semibold">
                  {summary.totalEntries}
                </span>
              </div>
              <div className="h-4 w-px bg-[rgba(51,51,51,0.6)]" />
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-[#555566] cyber-mono uppercase">Volume (cleared)</span>
                <span className="text-xs text-[#00FF41] cyber-mono font-semibold">
                  {formatCurrency(summary.totalVolume)}
                </span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="cyber-panel border border-[rgba(51,51,51,0.6)] overflow-hidden">
            <div className="max-h-[500px] overflow-y-auto cyber-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-[rgba(51,51,51,0.6)] hover:bg-transparent">
                    <TableHead className="text-[10px] text-[#555566] cyber-mono uppercase tracking-wider">
                      Tipo
                    </TableHead>
                    <TableHead className="text-[10px] text-[#555566] cyber-mono uppercase tracking-wider">
                      Status
                    </TableHead>
                    <TableHead className="text-[10px] text-[#555566] cyber-mono uppercase tracking-wider">
                      Montante
                    </TableHead>
                    <TableHead className="text-[10px] text-[#555566] cyber-mono uppercase tracking-wider">
                      Moeda
                    </TableHead>
                    <TableHead className="text-[10px] text-[#555566] cyber-mono uppercase tracking-wider">
                      Descrição
                    </TableHead>
                    <TableHead className="text-[10px] text-[#555566] cyber-mono uppercase tracking-wider">
                      Data
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <SkeletonRows />
                  ) : isError ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={6} className="h-32">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <AlertTriangle className="w-8 h-8 text-[#FF0040]" />
                          <p className="text-sm text-[#FF0040]">
                            Não foi possível carregar a atividade financeira.
                          </p>
                          <button
                            onClick={() => refetch()}
                            className="text-xs px-3 py-1 rounded border border-[rgba(0,255,65,0.3)] text-[#00FF41] hover:bg-[rgba(0,255,65,0.1)] transition-colors"
                          >
                            Tentar novamente
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={6} className="h-32">
                        <div className="flex items-center justify-center">
                          <span className="text-sm text-[#555566] cyber-mono">
                            Nenhuma atividade registrada.
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((entry) => {
                      const badge = TYPE_BADGE_MAP[entry.type];
                      const statusCfg = STATUS_DOT_MAP[entry.status];

                      return (
                        <TableRow
                          key={entry.id}
                          className="border-b-[rgba(51,51,51,0.3)] hover:bg-[rgba(0,255,65,0.02)]"
                        >
                          {/* Type */}
                          <TableCell>
                            <span
                              className={badge.className}
                              style={badge.style}
                            >
                              {badge.label}
                            </span>
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className={statusCfg.dotClass} />
                              <span className="text-xs text-[#888899]">
                                {statusCfg.label}
                              </span>
                            </div>
                          </TableCell>

                          {/* Amount */}
                          <TableCell>{renderAmount(entry)}</TableCell>

                          {/* Currency */}
                          <TableCell>
                            <span className="text-xs text-[#888899] cyber-mono">
                              {entry.currency}
                            </span>
                          </TableCell>

                          {/* Description */}
                          <TableCell>
                            <span className="text-xs text-[#888899] max-w-[200px] truncate block">
                              {entry.description || entry.reference || '—'}
                            </span>
                          </TableCell>

                          {/* Date */}
                          <TableCell>
                            <span className="text-xs text-[#555566] cyber-mono">
                              {formatLedgerDate(entry.created_at)}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* ── Tab: Payment Events ─────────────────────────────────── */}
        <TabsContent value="events" className="mt-4">
          <div className="cyber-panel border border-[rgba(51,51,51,0.6)] p-8">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[rgba(0,240,255,0.08)] border border-[rgba(0,240,255,0.2)] flex items-center justify-center">
                <span className="text-[#00F0FF] text-lg cyber-mono">⟐</span>
              </div>
              <p className="text-sm text-[#888899] text-center">
                Vista de eventos de gateway — disponível em breve.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
