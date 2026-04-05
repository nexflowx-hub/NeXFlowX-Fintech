'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Lock,
  Key,
  Webhook,
  FileText,
  Eye,
  EyeOff,
  Copy,
  Check,
  Plus,
  RefreshCw,
  Shield,
  AlertTriangle,
  ChevronRight,
  Code,
  Terminal,
  Zap,
  ArrowRight,
  BookOpen,
  Rocket,
  CreditCard,
  Boxes,
  ExternalLink,
} from 'lucide-react';
import { useAuthStore, isAdmin, isMerchant, isCustomer } from '@/lib/auth-store';
import { api } from '@/lib/api/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ApiKeyItem {
  id: string;
  key_hash: string;
  label?: string;
  created_at: string;
  last_used_at?: string;
  is_active: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(ts: string): string {
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

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// ─── Locked State (Customer Upsell) ─────────────────────────────────────────

function LockedDeveloperHub() {
  return (
    <div className="cyber-panel border border-[rgba(51,51,51,0.6)] overflow-hidden">
      <div className="relative flex flex-col items-center justify-center py-20 px-6 text-center">
        {/* Background blurred previews */}
        <div className="absolute inset-0 flex items-center justify-center gap-4 p-8 opacity-20 blur-sm pointer-events-none select-none">
          <div className="w-52 h-36 rounded-lg border border-[rgba(0,255,65,0.15)] bg-[rgba(0,255,65,0.02)]" />
          <div className="w-52 h-36 rounded-lg border border-[rgba(0,240,255,0.15)] bg-[rgba(0,240,255,0.02)]" />
          <div className="w-52 h-36 rounded-lg border border-[rgba(191,64,255,0.15)] bg-[rgba(191,64,255,0.02)]" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-5 max-w-lg">
          {/* Lock icon with glow */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-2xl bg-[rgba(255,184,0,0.06)] blur-xl" />
            <div className="relative w-24 h-24 rounded-2xl bg-[rgba(255,184,0,0.08)] border border-[rgba(255,184,0,0.25)] flex items-center justify-center">
              <Lock className="w-12 h-12 text-[#FFB800]" />
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[#E0E0E8] tracking-wide mb-2">
              Developer API
            </h2>
            <p className="text-[10px] cyber-mono text-[#555566] tracking-wider uppercase">
              Acesso Restrito — Conta Business Requerida
            </p>
          </div>

          <p className="text-sm text-[#888899] leading-relaxed">
            Integre pagamentos, gere links de checkout, configure webhooks em tempo real
            e automatize a sua operação financeira com a API NeXFlowX.
          </p>

          {/* Feature previews (blurred cards) */}
          <div className="grid grid-cols-3 gap-3 mt-4 w-full max-w-md">
            {[
              { icon: <Key className="w-4 h-4 text-[#00FF41]" />, title: 'API Keys', desc: 'Gestão de credenciais' },
              { icon: <Webhook className="w-4 h-4 text-[#00F0FF]" />, title: 'Webhooks', desc: 'Eventos em tempo real' },
              { icon: <CreditCard className="w-4 h-4 text-[#BF40FF]" />, title: 'Payments', desc: 'Checkout & Links' },
            ].map((feat) => (
              <div
                key={feat.title}
                className="px-4 py-3 rounded-lg border border-[rgba(51,51,51,0.4)] bg-[rgba(10,10,14,0.6)] backdrop-blur-md opacity-50 text-center"
              >
                <div className="flex items-center justify-center gap-1.5 mb-1.5">
                  {feat.icon}
                  <span className="text-xs text-[#888899] font-medium">{feat.title}</span>
                </div>
                <div className="text-[9px] text-[#555566]">{feat.desc}</div>
              </div>
            ))}
          </div>

          {/* Code preview blurred */}
          <div className="w-full max-w-md mt-2 rounded-lg bg-[rgba(0,0,0,0.4)] border border-[rgba(51,51,51,0.3)] p-4 overflow-hidden opacity-40">
            <pre className="text-[11px] cyber-mono text-[#00FF41] blur-[2px] select-none text-left">
{`const res = await fetch('/api/v1/payment-links', {
  method: 'POST',
  headers: {
    'x-api-key': 'nfx_live_••••••••',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 99.90,
    currency: 'EUR'
  })
});
// → { shareable_url: "https://pay.nexflowx.tech/..." }`}
            </pre>
          </div>

          {/* CTA Button */}
          <button
            className="mt-6 flex items-center gap-2.5 px-8 py-3.5 rounded-lg
              bg-[rgba(0,255,65,0.12)] border border-[rgba(0,255,65,0.35)]
              text-[#00FF41] font-semibold text-sm
              hover:bg-[rgba(0,255,65,0.2)] hover:border-[rgba(0,255,65,0.5)]
              transition-all duration-200 cyber-mono
              shadow-[0_0_30px_rgba(0,255,65,0.08)]"
          >
            <Rocket className="w-4 h-4" />
            Faça Upgrade para Conta Business
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-[10px] text-[#444455] mt-1">
            Contacte o suporte para ativar o acesso ao Developer Hub.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── API Keys Tab ───────────────────────────────────────────────────────────

function ApiKeysTab() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [createdRawKey, setCreatedRawKey] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.apiKeys.list();
      setKeys(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar chaves API.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      const res = await api.apiKeys.create(newKeyName || undefined);
      setCreatedRawKey(res.data.key);
      setNewKeyName('');
      await fetchKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar chave.');
    } finally {
      setCreating(false);
    }
  };

  const toggleReveal = (id: string) => {
    setRevealedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopy = async (text: string, id: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="w-5 h-5 text-[#00FF41] animate-spin" />
        <span className="ml-3 text-xs cyber-mono text-[#555566]">
          LOADING API KEYS...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Route indicator */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(10,10,14,0.4)] border border-[rgba(51,51,51,0.3)]">
        <span className="cyber-badge cyber-badge-green text-[9px]">GET</span>
        <code className="text-[11px] cyber-mono text-[#888899]">/api/v1/api-keys</code>
        <span className="text-[8px] cyber-mono text-[#333] mx-1">|</span>
        <span className="cyber-badge cyber-badge-amber text-[9px]">POST</span>
        <code className="text-[11px] cyber-mono text-[#888899]">/api/v1/api-keys</code>
      </div>

      {/* New key created banner */}
      {createdRawKey && (
        <div className="cyber-panel p-4 border border-[rgba(0,255,65,0.3)] bg-[rgba(0,255,65,0.04)]">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-[#FFB800] shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#FFB800] mb-1">
                Chave criada com sucesso — guarde-a agora!
              </p>
              <p className="text-[10px] text-[#888899] mb-2">
                Esta chave <strong>não</strong> será mostrada novamente. Copie e guarde num local seguro.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs text-[#00FF41] cyber-mono bg-[rgba(0,0,0,0.4)] px-3 py-2 rounded border border-[rgba(51,51,51,0.5)] break-all">
                  {createdRawKey}
                </code>
                <button
                  onClick={() => handleCopy(createdRawKey, 'new-key')}
                  className="shrink-0 p-2 rounded-lg border border-[rgba(0,255,65,0.3)] text-[#00FF41] hover:bg-[rgba(0,255,65,0.1)] transition-colors"
                >
                  {copiedId === 'new-key' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setCreatedRawKey(null)}
                  className="shrink-0 p-2 rounded-lg border border-[rgba(255,0,64,0.2)] text-[#555566] hover:text-[#FF0040] hover:border-[rgba(255,0,64,0.4)] transition-colors"
                  title="Fechar"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="cyber-panel p-3 border border-[rgba(255,0,64,0.2)] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#FF0040]" />
          <span className="text-xs text-[#FF0040]">{error}</span>
          <button
            onClick={fetchKeys}
            className="ml-auto text-[10px] px-2 py-1 rounded border border-[rgba(0,255,65,0.3)] text-[#00FF41] hover:bg-[rgba(0,255,65,0.1)] transition-colors"
          >
            RETRY
          </button>
        </div>
      )}

      {/* Generate new key */}
      <div className="cyber-panel p-4 border border-[rgba(51,51,51,0.6)]">
        <div className="flex items-center gap-2 mb-3">
          <Plus className="w-4 h-4 text-[#00FF41]" />
          <h3 className="text-sm font-semibold text-[#E0E0E8]">Gerar Nova Chave API</h3>
        </div>
        <p className="text-[11px] text-[#555566] mb-3">
          Use chaves API para autenticar pedidos do seu backend. A chave é passada no header <code className="text-[#00F0FF]">x-api-key</code>.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Label (ex: Produção - Checkout)"
            className="cyber-input flex-1"
          />
          <button
            onClick={handleCreate}
            disabled={creating}
            className="cyber-btn-primary flex items-center gap-2 px-4 py-2 text-sm"
          >
            {creating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Key className="w-4 h-4" />
            )}
            {creating ? 'Criando...' : 'Gerar Chave'}
          </button>
        </div>
      </div>

      {/* Keys list */}
      {keys.length === 0 ? (
        <div className="cyber-panel p-8 border border-[rgba(51,51,51,0.4)] text-center">
          <Key className="w-8 h-8 text-[#333] mx-auto mb-3" />
          <p className="text-xs text-[#555566] mb-1">
            Nenhuma chave API registada.
          </p>
          <p className="text-[10px] text-[#444455]">
            Crie a sua primeira chave acima para começar a integrar.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {keys.map((k) => {
            const revealed = revealedKeys.has(k.id);
            return (
              <div
                key={k.id}
                className="cyber-panel p-4 border border-[rgba(51,51,51,0.5)]
                  hover:border-[rgba(51,51,51,0.8)] transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Key className="w-3.5 h-3.5 text-[#00FF41]" />
                    <span className="text-sm font-medium text-[#E0E0E8]">
                      {k.label || `Chave #${k.id.slice(0, 8)}`}
                    </span>
                    <span className="cyber-badge cyber-badge-green text-[9px]">
                      {k.is_active ? 'ATIVA' : 'INATIVA'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#555566] cyber-mono">
                      {formatDate(k.created_at)}
                    </span>
                    {k.last_used_at && (
                      <>
                        <span className="text-[8px] text-[#333]">·</span>
                        <span className="text-[9px] text-[#444455]">Último uso: {formatDate(k.last_used_at)}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs cyber-mono text-[#888899] bg-[rgba(0,0,0,0.3)] px-3 py-1.5 rounded border border-[rgba(51,51,51,0.3)] overflow-hidden truncate">
                    {revealed ? k.key_hash : '•••••••••••••••••••••••••••••••'}
                  </code>
                  <button
                    onClick={() => toggleReveal(k.id)}
                    className="shrink-0 p-1.5 rounded-lg border border-[rgba(51,51,51,0.5)] text-[#555566] hover:text-[#E0E0E8] hover:border-[rgba(51,51,51,0.8)] transition-colors"
                    title={revealed ? 'Ocultar' : 'Mostrar'}
                  >
                    {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => handleCopy(k.key_hash, k.id)}
                    className="shrink-0 p-1.5 rounded-lg border border-[rgba(51,51,51,0.5)] text-[#555566] hover:text-[#E0E0E8] hover:border-[rgba(51,51,51,0.8)] transition-colors"
                    title="Copiar hash"
                  >
                    {copiedId === k.id ? <Check className="w-3.5 h-3.5 text-[#00FF41]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Webhooks Tab ───────────────────────────────────────────────────────────

function WebhooksTab() {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [hmacSecret, setHmacSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.users.getMe();
        setWebhookUrl(res.data.webhook_url ?? '');
        setHmacSecret(res.data.hmac_secret ?? '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar webhook.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      // PATCH /api/v1/users/me { webhook_url: "..." }
      await api.users.updateMe({ webhook_url: webhookUrl });
      setSuccess('Webhook URL atualizada com sucesso.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar webhook.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopySecret = async () => {
    if (!hmacSecret) return;
    const ok = await copyToClipboard(hmacSecret);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="w-5 h-5 text-[#00F0FF] animate-spin" />
        <span className="ml-3 text-xs cyber-mono text-[#555566]">
          LOADING WEBHOOK CONFIG...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Route indicator */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(10,10,14,0.4)] border border-[rgba(51,51,51,0.3)]">
        <span className="cyber-badge cyber-badge-green text-[9px]">PATCH</span>
        <code className="text-[11px] cyber-mono text-[#888899]">/api/v1/users/me</code>
        <span className="text-[9px] text-[#555566] ml-auto">{`{ webhook_url: "..." }`}</span>
      </div>

      {/* Feedback */}
      {error && (
        <div className="cyber-panel p-3 border border-[rgba(255,0,64,0.2)] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#FF0040]" />
          <span className="text-xs text-[#FF0040]">{error}</span>
        </div>
      )}
      {success && (
        <div className="cyber-panel p-3 border border-[rgba(0,255,65,0.3)] flex items-center gap-2">
          <Check className="w-4 h-4 text-[#00FF41]" />
          <span className="text-xs text-[#00FF41]">{success}</span>
        </div>
      )}

      {/* Webhook URL Form */}
      <div className="cyber-panel p-5 border border-[rgba(51,51,51,0.6)]">
        <div className="flex items-center gap-2 mb-3">
          <Webhook className="w-4 h-4 text-[#00F0FF]" />
          <h3 className="text-sm font-semibold text-[#E0E0E8]">Endpoint de Webhook</h3>
        </div>
        <p className="text-xs text-[#888899] mb-3">
          Configure a URL do seu servidor para receber notificações em tempo real sobre eventos
          na sua conta. Cada pedido é assinado com <code className="text-[#00F0FF]">HMAC-SHA256</code> usando o seu segredo.
        </p>
        <div className="flex gap-2">
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://seu-backend.com/webhooks/nexflowx"
            className="cyber-input flex-1"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="cyber-btn-primary flex items-center gap-2 px-4 py-2 text-sm"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* HMAC Secret */}
      <div className="cyber-panel p-5 border border-[rgba(51,51,51,0.6)]">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-[#BF40FF]" />
          <h3 className="text-sm font-semibold text-[#E0E0E8]">Segredo HMAC-SHA256</h3>
        </div>
        <p className="text-xs text-[#888899] mb-3">
          Use este segredo para verificar a autenticidade dos webhooks recebidos.
          O header <code className="text-[#00F0FF]">X-NexFlowX-Signature</code> contém a assinatura.
        </p>
        {hmacSecret ? (
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs cyber-mono text-[#BF40FF] bg-[rgba(0,0,0,0.3)] px-3 py-2 rounded border border-[rgba(191,64,255,0.2)] break-all">
              {hmacSecret}
            </code>
            <button
              onClick={handleCopySecret}
              className="shrink-0 p-2 rounded-lg border border-[rgba(51,51,51,0.5)] text-[#555566] hover:text-[#E0E0E8] transition-colors"
              title="Copiar"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#00FF41]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        ) : (
          <p className="text-xs text-[#555566] italic">
            Nenhum segredo HMAC disponível. Defina uma Webhook URL primeiro.
          </p>
        )}

        {/* Signature verification code example */}
        {hmacSecret && (
          <div className="mt-4 bg-[rgba(0,0,0,0.4)] rounded-lg border border-[rgba(51,51,51,0.5)] p-3 overflow-x-auto">
            <p className="text-[10px] cyber-mono text-[#555566] mb-2 uppercase">Exemplo — Verificação Node.js</p>
            <pre className="text-[11px] cyber-mono text-[#E0E0E8]">
{`const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}`}
            </pre>
          </div>
        )}
      </div>

      {/* Events catalog */}
      <div className="cyber-panel p-5 border border-[rgba(51,51,51,0.4)]">
        <h4 className="text-xs font-semibold text-[#888899] mb-1 cyber-mono uppercase tracking-wider">
          Catálogo de Eventos
        </h4>
        <p className="text-[10px] text-[#555566] mb-3">
          Estes são os eventos que o seu endpoint pode receber.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { event: 'wallet.credit', desc: 'Crédito em carteira', color: '#00FF41' },
            { event: 'wallet.debit', desc: 'Débito em carteira', color: '#FF0040' },
            { event: 'swap.completed', desc: 'Conversão FX concluída', color: '#00F0FF' },
            { event: 'payout.created', desc: 'Levantamento criado', color: '#FFB800' },
            { event: 'payout.completed', desc: 'Levantamento processado', color: '#00FF41' },
            { event: 'payout.failed', desc: 'Levantamento falhado', color: '#FF0040' },
            { event: 'payment_link.paid', desc: 'Link de pagamento liquidado', color: '#BF40FF' },
            { event: 'payment_link.expired', desc: 'Link de pagamento expirado', color: '#555566' },
          ].map((e) => (
            <div
              key={e.event}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(10,10,14,0.4)] border border-[rgba(51,51,51,0.3)]"
            >
              <ChevronRight className="w-3 h-3" style={{ color: e.color }} />
              <code className="text-[11px] cyber-mono text-[#00F0FF]">{e.event}</code>
              <span className="text-[10px] text-[#555566] ml-auto">{e.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Getting Started Tab ────────────────────────────────────────────────────

function GettingStartedTab() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="cyber-panel p-6 border border-[rgba(0,255,65,0.2)] bg-[rgba(0,255,65,0.02)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-[rgba(0,255,65,0.1)] border border-[rgba(0,255,65,0.2)]">
            <Rocket className="w-5 h-5 text-[#00FF41]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#E0E0E8]">Quick Start — Merchant Integration</h3>
            <p className="text-[11px] text-[#555566] cyber-mono">
              Integre pagamentos em menos de 5 minutos
            </p>
          </div>
        </div>
        <p className="text-sm text-[#888899] leading-relaxed">
          Este guia orienta-o passo-a-passo na integração da API NeXFlowX para aceitar pagamentos,
          gerar links de checkout e automatizar a sua operação financeira.
        </p>
      </div>

      {/* Step 1 — Authentication */}
      <div className="cyber-panel p-5 border border-[rgba(51,51,51,0.6)]">
        <div className="flex items-center gap-3 mb-4">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[rgba(0,255,65,0.15)] border border-[rgba(0,255,65,0.3)] text-xs font-bold text-[#00FF41] cyber-mono">
            1
          </span>
          <h4 className="text-sm font-semibold text-[#E0E0E8]">Autenticação</h4>
          <span className="cyber-badge cyber-badge-green text-[9px] ml-auto">JWT</span>
        </div>
        <p className="text-xs text-[#888899] mb-3">
          Existem dois métodos de autenticação dependendo do endpoint:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div className="px-4 py-3 rounded-lg bg-[rgba(10,10,14,0.4)] border border-[rgba(51,51,51,0.3)]">
            <code className="text-[11px] cyber-mono text-[#00FF41]">Authorization: Bearer</code>
            <p className="text-[10px] text-[#555566] mt-1">Para endpoints protegidos (wallets, swap, payout, ledger)</p>
          </div>
          <div className="px-4 py-3 rounded-lg bg-[rgba(10,10,14,0.4)] border border-[rgba(51,51,51,0.3)]">
            <code className="text-[11px] cyber-mono text-[#00F0FF]">x-api-key: nfx_live_...</code>
            <p className="text-[10px] text-[#555566] mt-1">Para criar payment links (server-to-server)</p>
          </div>
        </div>
        <div className="bg-[rgba(0,0,0,0.4)] rounded-lg border border-[rgba(51,51,51,0.5)] p-3 overflow-x-auto">
          <pre className="text-[11px] cyber-mono text-[#E0E0E8]">
{`# Obter token JWT
curl -X POST ${process.env.NEXT_PUBLIC_API_URL || 'https://api-dev.nexflowx.tech/api/v1'}/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username": "merchant@example.com", "password": "***"}'

# Resposta:
# { "token": "eyJhbG...", "user": { "role": "merchant", ... } }`}
          </pre>
        </div>
      </div>

      {/* Step 2 — Generate API Key */}
      <div className="cyber-panel p-5 border border-[rgba(51,51,51,0.6)]">
        <div className="flex items-center gap-3 mb-4">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[rgba(0,240,255,0.15)] border border-[rgba(0,240,255,0.3)] text-xs font-bold text-[#00F0FF] cyber-mono">
            2
          </span>
          <h4 className="text-sm font-semibold text-[#E0E0E8]">Gerar Chave API</h4>
          <span className="cyber-badge cyber-badge-cyan text-[9px] ml-auto">x-api-key</span>
        </div>
        <p className="text-xs text-[#888899] mb-3">
          Na aba <strong className="text-[#E0E0E8]">Chaves API</strong> acima, gere uma nova chave com um label descritivo
          (ex: <code className="text-[#00F0FF]">Produção - Checkout</code>). Use-a no header <code className="text-[#00F0FF]">x-api-key</code> para criar payment links.
        </p>
        <div className="bg-[rgba(0,0,0,0.4)] rounded-lg border border-[rgba(51,51,51,0.5)] p-3 overflow-x-auto">
          <pre className="text-[11px] cyber-mono text-[#E0E0E8]">
{`# Criar chave via API
curl -X POST ${process.env.NEXT_PUBLIC_API_URL || 'https://api-dev.nexflowx.tech/api/v1'}/api-keys \\
  -H "Authorization: Bearer eyJhbG..." \\
  -H "Content-Type: application/json" \\
  -d '{"label": "Produção - Checkout"}'

# Resposta: { "data": { "key": "nfx_live_abc123...", ... } }
# IMPORTANTE: Guarde a chave — não será mostrada novamente!`}
          </pre>
        </div>
      </div>

      {/* Step 3 — Create Payment Link */}
      <div className="cyber-panel p-5 border border-[rgba(51,51,51,0.6)]">
        <div className="flex items-center gap-3 mb-4">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[rgba(191,64,255,0.15)] border border-[rgba(191,64,255,0.3)] text-xs font-bold text-[#BF40FF] cyber-mono">
            3
          </span>
          <h4 className="text-sm font-semibold text-[#E0E0E8]">Criar Link de Pagamento</h4>
          <span className="cyber-badge text-[9px] ml-auto" style={{ background: 'rgba(191,64,255,0.1)', color: '#BF40FF', border: '1px solid rgba(191,64,255,0.3)' }}>
            Payments
          </span>
        </div>
        <p className="text-xs text-[#888899] mb-3">
          Gere um link de pagamento e partilhe-o com os seus clientes. Quando o pagamento for
          processado, recebe um webhook <code className="text-[#00F0FF]">payment_link.paid</code>.
        </p>
        <div className="bg-[rgba(0,0,0,0.4)] rounded-lg border border-[rgba(51,51,51,0.5)] p-3 overflow-x-auto">
          <pre className="text-[11px] cyber-mono text-[#E0E0E8]">
{`curl -X POST ${process.env.NEXT_PUBLIC_API_URL || 'https://api-dev.nexflowx.tech/api/v1'}/payment-links \\
  -H "x-api-key: nfx_live_abc123..." \\
  -H "Content-Type: application/json" \\
  -d '{"amount": 99.90, "currency": "EUR"}'

# Resposta:
# {
#   "data": {
#     "id": "pl_xyz789",
#     "shareable_url": "https://pay.nexflowx.tech/pl_xyz789"
#   }
# }`}
          </pre>
        </div>
        <div className="mt-3 px-3 py-2 rounded-lg bg-[rgba(255,184,0,0.04)] border border-dashed border-[rgba(255,184,0,0.2)]">
          <p className="text-[10px] text-[#FFB800]">
            <strong>Dica:</strong> Redirecione o cliente para <code className="text-[#00F0FF]">shareable_url</code> — ele verá uma
            página de checkout segura onde pode efetuar o pagamento.
          </p>
        </div>
      </div>

      {/* Step 4 — Configure Webhooks */}
      <div className="cyber-panel p-5 border border-[rgba(51,51,51,0.6)]">
        <div className="flex items-center gap-3 mb-4">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[rgba(255,184,0,0.15)] border border-[rgba(255,184,0,0.3)] text-xs font-bold text-[#FFB800] cyber-mono">
            4
          </span>
          <h4 className="text-sm font-semibold text-[#E0E0E8]">Configurar Webhooks</h4>
          <span className="cyber-badge cyber-badge-amber text-[9px] ml-auto">Real-time</span>
        </div>
        <p className="text-xs text-[#888899] mb-3">
          Na aba <strong className="text-[#E0E0E8]">Webhooks</strong>, defina a URL do seu servidor e use o
          HMAC secret para verificar as assinaturas dos eventos recebidos.
        </p>
        <div className="bg-[rgba(0,0,0,0.4)] rounded-lg border border-[rgba(51,51,51,0.5)] p-3 overflow-x-auto">
          <pre className="text-[11px] cyber-mono text-[#E0E0E8]">
{`# Configurar webhook
curl -X PATCH ${process.env.NEXT_PUBLIC_API_URL || 'https://api-dev.nexflowx.tech/api/v1'}/users/me \\
  -H "Authorization: Bearer eyJhbG..." \\
  -H "Content-Type: application/json" \\
  -d '{"webhook_url": "https://seu-backend.com/webhooks/nexflowx"}'

# Exemplo de payload recebido no webhook:
# POST https://seu-backend.com/webhooks/nexflowx
# Headers:
#   X-NexFlowX-Event: payment_link.paid
#   X-NexFlowX-Signature: sha256=abc123...
# Body: { "event": "payment_link.paid", "data": { ... } }`}
          </pre>
        </div>
      </div>

      {/* Step 5 — Test in Sandbox */}
      <div className="cyber-panel p-5 border border-[rgba(0,255,65,0.15)]">
        <div className="flex items-center gap-3 mb-4">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[rgba(0,255,65,0.15)] border border-[rgba(0,255,65,0.3)] text-xs font-bold text-[#00FF41] cyber-mono">
            5
          </span>
          <h4 className="text-sm font-semibold text-[#E0E0E8]">Testar em Sandbox</h4>
          <span className="cyber-badge cyber-badge-green text-[9px] ml-auto">SANDBOX</span>
        </div>
        <p className="text-xs text-[#888899] mb-3">
          Todos os endpoints estão disponíveis em modo sandbox. Utilize a base URL <code className="text-[#00F0FF]">{process.env.NEXT_PUBLIC_API_URL || 'https://api-dev.nexflowx.tech/api/v1'}</code> para testar.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Base URL', value: process.env.NEXT_PUBLIC_API_URL || 'https://api-dev.nexflowx.tech/api/v1', color: '#00F0FF' },
            { label: 'Ambiente', value: 'Sandbox (dev)', color: '#FFB800' },
            { label: 'Rate Limit', value: '100 req/min', color: '#BF40FF' },
          ].map((item) => (
            <div key={item.label} className="px-3 py-2.5 rounded-lg bg-[rgba(10,10,14,0.4)] border border-[rgba(51,51,51,0.3)]">
              <p className="text-[9px] cyber-mono text-[#555566] uppercase">{item.label}</p>
              <p className="text-xs cyber-mono font-medium" style={{ color: item.color }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── API Reference Tab ──────────────────────────────────────────────────────

function ApiReferenceTab() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api-dev.nexflowx.tech/api/v1';

  return (
    <div className="space-y-5">
      {/* Authentication */}
      <div className="cyber-panel p-5 border border-[rgba(51,51,51,0.6)]">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-[#00FF41]" />
          <h3 className="text-sm font-semibold text-[#E0E0E8]">Autenticação</h3>
          <span className="cyber-badge cyber-badge-green text-[9px] ml-auto">POST /auth/login</span>
        </div>
        <div className="bg-[rgba(0,0,0,0.4)] rounded-lg border border-[rgba(51,51,51,0.5)] p-3 overflow-x-auto">
          <pre className="text-[11px] cyber-mono text-[#E0E0E8]">
{`POST ${baseUrl}/auth/login
Content-Type: application/json

{
  "username": "merchant@example.com",
  "password": "your_password"
}

→ 200 { "token": "eyJhbG...", "user": { "id": "...", "role": "merchant" } }
→ 401 { "error": { "code": "UNAUTHORIZED", "message": "Invalid credentials" } }`}
          </pre>
        </div>
      </div>

      {/* Wallets */}
      <div className="cyber-panel p-5 border border-[rgba(51,51,51,0.6)]">
        <div className="flex items-center gap-2 mb-3">
          <Boxes className="w-4 h-4 text-[#00F0FF]" />
          <h3 className="text-sm font-semibold text-[#E0E0E8]">Carteiras</h3>
          <span className="cyber-badge cyber-badge-green text-[9px] ml-auto">GET /wallets</span>
        </div>
        <p className="text-[11px] text-[#888899] mb-3">
          Lista todas as carteiras associadas à conta do merchant, incluindo saldos disponíveis e em clearing.
        </p>
        <div className="bg-[rgba(0,0,0,0.4)] rounded-lg border border-[rgba(51,51,51,0.5)] p-3 overflow-x-auto">
          <pre className="text-[11px] cyber-mono text-[#E0E0E8]">
{`GET ${baseUrl}/wallets
Authorization: Bearer eyJhbG...

→ 200 {
  "data": [
    {
      "id": "wal_abc123",
      "currency_code": "EUR",
      "type": "merchant",
      "balance_total": 10500.50,
      "balance_available": 10000.00
    },
    {
      "id": "wal_def456",
      "currency_code": "USDT",
      "type": "merchant",
      "balance_total": 5000.00,
      "balance_available": 5000.00
    }
  ]
}`}
          </pre>
        </div>
      </div>

      {/* Payment Links */}
      <div className="cyber-panel p-5 border border-[rgba(191,64,255,0.15)]">
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="w-4 h-4 text-[#BF40FF]" />
          <h3 className="text-sm font-semibold text-[#E0E0E8]">Payment Links (Checkout)</h3>
          <span className="cyber-badge cyber-badge-amber text-[9px] ml-auto">POST /payment-links</span>
        </div>
        <p className="text-[11px] text-[#888899] mb-1">
          Cria um link de pagamento partilhável. O cliente é redirecionado para uma página de checkout segura.
        </p>
        <p className="text-[10px] text-[#FFB800] mb-3">
          <strong>Atenção:</strong> Este endpoint usa <code className="text-[#00F0FF]">x-api-key</code> em vez de Bearer token.
        </p>
        <div className="bg-[rgba(0,0,0,0.4)] rounded-lg border border-[rgba(51,51,51,0.5)] p-3 overflow-x-auto">
          <pre className="text-[11px] cyber-mono text-[#E0E0E8]">
{`POST ${baseUrl}/payment-links
x-api-key: nfx_live_abc123...
Content-Type: application/json

{
  "amount": 99.90,
  "currency": "EUR"
}

→ 200 {
  "data": {
    "id": "pl_xyz789",
    "shareable_url": "https://pay.nexflowx.tech/pl_xyz789"
  }
}`}
          </pre>
        </div>
      </div>

      {/* Swap */}
      <div className="cyber-panel p-5 border border-[rgba(51,51,51,0.6)]">
        <div className="flex items-center gap-2 mb-3">
          <ArrowRight className="w-4 h-4 text-[#FFB800]" />
          <h3 className="text-sm font-semibold text-[#E0E0E8]">Conversão FX (Swap)</h3>
          <span className="cyber-badge cyber-badge-amber text-[9px] ml-auto">POST /swap</span>
        </div>
        <div className="bg-[rgba(0,0,0,0.4)] rounded-lg border border-[rgba(51,51,51,0.5)] p-3 overflow-x-auto">
          <pre className="text-[11px] cyber-mono text-[#E0E0E8]">
{`POST ${baseUrl}/swap
Authorization: Bearer eyJhbG...
Content-Type: application/json

{
  "amount": "1000.00",
  "from_currency": "EUR",
  "to_currency": "USDT"
}

→ 200 {
  "success": true,
  "converted": 1085.42,
  "fee": 2.50,
  "rate": 1.0879
}`}
          </pre>
        </div>
      </div>

      {/* Payout */}
      <div className="cyber-panel p-5 border border-[rgba(51,51,51,0.6)]">
        <div className="flex items-center gap-2 mb-3">
          <Code className="w-4 h-4 text-[#BF40FF]" />
          <h3 className="text-sm font-semibold text-[#E0E0E8]">Levantamentos (Payout)</h3>
          <span className="cyber-badge cyber-badge-amber text-[9px] ml-auto">POST /payout</span>
        </div>
        <p className="text-[11px] text-[#888899] mb-3">
          Métodos suportados: <code className="text-[#00F0FF]">IBAN</code>, <code className="text-[#00F0FF]">SEPA</code>, <code className="text-[#00F0FF]">PIX</code>, <code className="text-[#00F0FF]">CRYPTO</code>, <code className="text-[#00F0FF]">BANK</code>.
        </p>
        <div className="bg-[rgba(0,0,0,0.4)] rounded-lg border border-[rgba(51,51,51,0.5)] p-3 overflow-x-auto">
          <pre className="text-[11px] cyber-mono text-[#E0E0E8]">
{`POST ${baseUrl}/payout
Authorization: Bearer eyJhbG...
Content-Type: application/json

{
  "amount": "500.00",
  "currency": "EUR",
  "method": "IBAN",
  "destination": "PT50123456789012345678901"
}

→ 200 {
  "success": true,
  "message": "Payout request submitted for review."
}`}
          </pre>
        </div>
      </div>

      {/* Ledger */}
      <div className="cyber-panel p-5 border border-[rgba(51,51,51,0.6)]">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-[#00FF41]" />
          <h3 className="text-sm font-semibold text-[#E0E0E8]">Ledger / Histórico Financeiro</h3>
          <span className="cyber-badge cyber-badge-green text-[9px] ml-auto">GET /ledger</span>
        </div>
        <p className="text-[11px] text-[#888899] mb-3">
          Query params: <code className="text-[#00F0FF]">page</code>, <code className="text-[#00F0FF]">limit</code>, <code className="text-[#00F0FF]">type</code>, <code className="text-[#00F0FF]">status</code>.
        </p>
        <div className="bg-[rgba(0,0,0,0.4)] rounded-lg border border-[rgba(51,51,51,0.5)] p-3 overflow-x-auto">
          <pre className="text-[11px] cyber-mono text-[#E0E0E8]">
{`GET ${baseUrl}/ledger?page=1&limit=20&type=PAYIN&status=cleared
Authorization: Bearer eyJhbG...

→ 200 {
  "data": [
    {
      "id": "txn_abc",
      "type": "PAYIN",
      "status": "cleared",
      "direction": "CREDIT",
      "amount": 1000.00,
      "currency": "EUR",
      "description": "Payment link #pl_xyz789",
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 42, "total_pages": 3 }
}`}
          </pre>
        </div>
      </div>

      {/* Error Codes */}
      <div className="cyber-panel p-5 border border-[rgba(51,51,51,0.6)]">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-[#FF0040]" />
          <h3 className="text-sm font-semibold text-[#E0E0E8]">Códigos de Erro</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[rgba(51,51,51,0.4)]">
                <th className="text-left py-2 px-3 text-[#555566] cyber-mono font-medium">Código</th>
                <th className="text-left py-2 px-3 text-[#555566] cyber-mono font-medium">Status</th>
                <th className="text-left py-2 px-3 text-[#555566] cyber-mono font-medium">Descrição</th>
              </tr>
            </thead>
            <tbody>
              {[
                { code: 'UNAUTHORIZED', status: 401, desc: 'Token inválido ou expirado' },
                { code: 'FORBIDDEN', status: 403, desc: 'Sem permissão (role insuficiente)' },
                { code: 'INSUFFICIENT_BALANCE', status: 400, desc: 'Saldo insuficiente para a operação' },
                { code: 'INVALID_CURRENCY', status: 400, desc: 'Moeda não suportada ou não encontrada' },
                { code: 'SAME_CURRENCY', status: 400, desc: 'Moedas de origem e destino iguais' },
                { code: 'INVALID_DESTINATION', status: 400, desc: 'Destino inválido para o método selecionado' },
                { code: 'RATE_LIMIT_EXCEEDED', status: 429, desc: 'Limite de requests excedido' },
                { code: 'INTERNAL_ERROR', status: 500, desc: 'Erro interno do servidor' },
              ].map((e) => (
                <tr key={e.code} className="border-b border-[rgba(51,51,51,0.2)] hover:bg-[rgba(10,10,14,0.4)]">
                  <td className="py-2 px-3 cyber-mono text-[#FF0040]">{e.code}</td>
                  <td className="py-2 px-3 cyber-mono text-[#FFB800]">{e.status}</td>
                  <td className="py-2 px-3 text-[#888899]">{e.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SDK notice */}
      <div className="cyber-panel p-4 border border-dashed border-[rgba(0,240,255,0.2)] bg-[rgba(0,240,255,0.02)]">
        <div className="flex items-start gap-3">
          <Terminal className="w-4 h-4 text-[#00F0FF] mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-[#E0E0E8] font-medium mb-1">Procurando um SDK?</p>
            <p className="text-[11px] text-[#555566]">
              SDKs oficiais para Node.js, Python e PHP serão disponibilizados em breve.
              Até lá, use a API REST diretamente — os exemplos acima são fully functional.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Full Developer Hub (Merchant + Admin) ──────────────────────────────────

function DeveloperHub() {
  return (
    <Tabs defaultValue="getting-started" className="space-y-4">
      <TabsList className="bg-[rgba(10,10,14,0.6)] border border-[rgba(51,51,51,0.5)] p-1 flex-wrap gap-1 h-auto">
        <TabsTrigger
          value="getting-started"
          className="data-[state=active]:bg-[rgba(0,255,65,0.08)] data-[state=active]:text-[#00FF41] data-[state=active]:border-[rgba(0,255,65,0.3)] text-[#888899] border border-transparent px-4 py-1.5 text-xs cyber-mono"
        >
          <Rocket className="w-3.5 h-3.5 mr-1.5" />
          Quick Start
        </TabsTrigger>
        <TabsTrigger
          value="api-keys"
          className="data-[state=active]:bg-[rgba(0,255,65,0.08)] data-[state=active]:text-[#00FF41] data-[state=active]:border-[rgba(0,255,65,0.3)] text-[#888899] border border-transparent px-4 py-1.5 text-xs cyber-mono"
        >
          <Key className="w-3.5 h-3.5 mr-1.5" />
          Chaves API
        </TabsTrigger>
        <TabsTrigger
          value="webhooks"
          className="data-[state=active]:bg-[rgba(0,240,255,0.08)] data-[state=active]:text-[#00F0FF] data-[state=active]:border-[rgba(0,240,255,0.3)] text-[#888899] border border-transparent px-4 py-1.5 text-xs cyber-mono"
        >
          <Webhook className="w-3.5 h-3.5 mr-1.5" />
          Webhooks
        </TabsTrigger>
        <TabsTrigger
          value="docs"
          className="data-[state=active]:bg-[rgba(191,64,255,0.08)] data-[state=active]:text-[#BF40FF] data-[state=active]:border-[rgba(191,64,255,0.3)] text-[#888899] border border-transparent px-4 py-1.5 text-xs cyber-mono"
        >
          <BookOpen className="w-3.5 h-3.5 mr-1.5" />
          API Reference
        </TabsTrigger>
      </TabsList>

      <TabsContent value="getting-started">
        <GettingStartedTab />
      </TabsContent>
      <TabsContent value="api-keys">
        <ApiKeysTab />
      </TabsContent>
      <TabsContent value="webhooks">
        <WebhooksTab />
      </TabsContent>
      <TabsContent value="docs">
        <ApiReferenceTab />
      </TabsContent>
    </Tabs>
  );
}

// ─── Main Component (RBAC Router) ──────────────────────────────────────────

export default function ApiManagement() {
  const { user } = useAuthStore();

  // Customer → locked upsell state
  if (isCustomer(user)) {
    return <LockedDeveloperHub />;
  }

  // Merchant + Admin → full developer hub
  return <DeveloperHub />;
}
