'use client';

import { Shield, AlertTriangle, Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore, isAdmin } from '@/lib/auth-store';
import {
  useActionTickets,
  useApproveTicket,
} from '@/hooks/use-wallets';
import type { ActionTicketStatus } from '@/lib/api/contracts';
type StatusString = ActionTicketStatus | string;
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

// ─── Helpers ───────────────────────────────────────────────────────────────

function truncate(str: string, maxLen: number = 16): string {
  if (!str) return '—';
  if (str.length <= maxLen) return str;
  return `${str.slice(0, maxLen - 3)}...`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

// ─── Status Badge ──────────────────────────────────────────────────────────

const statusConfig: Record<
  ActionTicketStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  pending_review: {
    label: 'Pendente',
    badgeClass: 'cyber-badge cyber-badge-amber',
    dotClass: 'warning',
  },
  approved: {
    label: 'Aprovado',
    badgeClass: 'cyber-badge cyber-badge-green',
    dotClass: 'active',
  },
  rejected: {
    label: 'Rejeitado',
    badgeClass: 'cyber-badge cyber-badge-red',
    dotClass: 'error',
  },
  processing: {
    label: 'Processando',
    badgeClass: 'cyber-badge cyber-badge-cyan',
    dotClass: 'active',
  },
};

function StatusBadge({ status }: { status: StatusString }) {
  const cfg = statusConfig[status as ActionTicketStatus] ?? statusConfig.pending_review;
  return (
    <span className={`flex items-center gap-1.5 ${cfg.badgeClass}`}>
      <span className={`status-dot ${cfg.dotClass}`} style={{ width: '6px', height: '6px' }} />
      {cfg.label}
    </span>
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
        Esta secção está disponível apenas para utilizadores com privilégios de administrador.
      </p>
    </div>
  );
}

// ─── Skeleton Rows ─────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={`skeleton-row-${i}`}
          className="flex items-center gap-4 px-4 py-3 rounded-lg bg-[rgba(10,10,14,0.4)] animate-pulse"
        >
          <div className="w-20 h-4 rounded bg-[rgba(51,51,51,0.4)]" />
          <div className="w-24 h-4 rounded bg-[rgba(51,51,51,0.4)]" />
          <div className="w-20 h-4 rounded bg-[rgba(51,51,51,0.4)]" />
          <div className="w-28 h-4 rounded bg-[rgba(51,51,51,0.4)]" />
          <div className="w-20 h-4 rounded bg-[rgba(51,51,51,0.4)]" />
          <div className="flex gap-2">
            <div className="w-20 h-8 rounded bg-[rgba(51,51,51,0.4)]" />
            <div className="w-20 h-8 rounded bg-[rgba(51,51,51,0.4)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function AdminApprovalTable() {
  const user = useAuthStore((s) => s.user);

  const { data: tickets, isLoading, isError } = useActionTickets();
  const approveMutation = useApproveTicket();

  if (!isAdmin(user)) {
    return (
      <div className="cyber-panel p-6">
        <RestrictedAccess />
      </div>
    );
  }

  const isMutating = approveMutation.isPending;

  const handleApprove = async (id: string) => {
    try {
      await approveMutation.mutateAsync(id);
      toast.success('Ticket aprovado com sucesso.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao aprovar ticket.';
      toast.error(message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Shield className="w-5 h-5 text-[#FFB800]" />
        <h2 className="text-lg font-semibold text-[#E0E0E8]">Tickets de Ação</h2>
        <span className="cyber-badge cyber-badge-amber">ADMIN</span>
      </div>

      <div className="cyber-panel p-4">
        {isLoading ? (
          <SkeletonRows />
        ) : isError || !tickets ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <AlertTriangle className="w-6 h-6 text-[#FF0040]" />
            <p className="text-sm text-[#FF0040]">
              Não foi possível carregar os tickets de ação.
            </p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-[#555566] cyber-mono">
              Nenhum ticket de ação encontrado.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto cyber-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[rgba(51,51,51,0.4)] hover:bg-transparent">
                  <TableHead className="text-[10px] cyber-mono text-[#555566] uppercase tracking-wider">
                    ID
                  </TableHead>
                  <TableHead className="text-[10px] cyber-mono text-[#555566] uppercase tracking-wider">
                    Tipo
                  </TableHead>
                  <TableHead className="text-[10px] cyber-mono text-[#555566] uppercase tracking-wider">
                    Prioridade
                  </TableHead>
                  <TableHead className="text-[10px] cyber-mono text-[#555566] uppercase tracking-wider">
                    Merchant
                  </TableHead>
                  <TableHead className="text-[10px] cyber-mono text-[#555566] uppercase tracking-wider">
                    Estado
                  </TableHead>
                  <TableHead className="text-[10px] cyber-mono text-[#555566] uppercase tracking-wider">
                    Criado em
                  </TableHead>
                  <TableHead className="text-[10px] cyber-mono text-[#555566] uppercase tracking-wider text-right">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    className="border-b border-[rgba(51,51,51,0.2)] hover:bg-[rgba(0,255,65,0.02)]"
                  >
                    <TableCell className="text-xs cyber-mono text-[#888899]">
                      {truncate(ticket.id, 10)}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-[#888899] cyber-mono">
                        {ticket.type || '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-[#E0E0E8] cyber-mono">
                        {ticket.priority || '—'}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-[#E0E0E8]">
                      {ticket.merchant_name}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={ticket.status} />
                    </TableCell>
                    <TableCell className="text-xs cyber-mono text-[#555566]">
                      {formatDate(ticket.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      {ticket.status === 'pending_review' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(ticket.id)}
                            disabled={isMutating}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium
                              border border-[rgba(0,255,65,0.3)] text-[#00FF41]
                              hover:bg-[rgba(0,255,65,0.1)] transition-colors
                              disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {approveMutation.isPending ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                            Aprovar
                          </button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
