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

interface UserProfile {
  webhook_url?: string;
  hmac_secret?: string;
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

// ─── Locked State (Customer) ────────────────────────────────────────────────

function LockedDeveloperHub() {
  return (
    <div className="cyber-panel border border-[rgba(51,51,51,0.6)] overflow-hidden">
      {/* Lock overlay */}
      <div className="relative flex flex-col items-center justify-center py-20 px-6 text-center">
        {/* Background blurred previews */}
        <div className="absolute inset-0 flex items-center justify-center gap-4 p-8 opacity-30 blur-sm pointer-events-none select-none">
          <div className="w-48 h-32 rounded-lg border border-[rgba(0,255,65,0.2)] bg-[rgba(0,255,65,0.03)]" />
          <div className="w-48 h-32 rounded-lg border border-[rgba(0,240,255,0.2)] bg-[rgba(0,240,255,0.03)]" />
          <div className="w-48 h-32 rounded-lg border border-[rgba(191,64,255,0.2)] bg-[rgba(191,64,255,0.03)]" />
        </div>

        {/* Lock icon */}
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-[rgba(255,184,0,0.08)] border border-[rgba(255,184,0,0.25)] flex items-center justify-center">
            <Lock className="w-10 h-10 text-[#FFB800]" />
          </div>

          <h2 className="text-xl font-bold text-[#E0E0E8] tracking-wide">
            Developer API — Acesso Restrito
          </h2>

          <p className="text-sm text-[#888899] max-w-md leading-relaxed">
            Faça upgrade para Conta Business para aceder a integrações API e Webhooks.
          </p>

          {/* Visual preview cards (blurred) */}
          <div className="flex gap-3 mt-6">
            <div className="px-4 py-3 rounded-lg border border-[rgba(51,51,51,0.4)] bg-[rgba(10,10,14,0.6)] backdrop-blur-md opacity-60">
              <div className="flex items-center gap-2 mb-1.5">
                <Key className="w-3.5 h-3.5 text-[#00FF41]" />
                <span className="text-xs text-[#888899]">Chaves API</span>
              </div>
              <div className="w-24 h-2 rounded bg-[rgba(51,51,51,0.5)]" />
            </div>
            <div className="px-4 py-3 rounded-lg border border-[rgba(51,51,51,0.4)] bg-[rgba(10,10,14,0.6)] backdrop-blur-md opacity-60">
              <div className="flex items-center gap-2 mb-1.5">
                <Webhook className="w-3.5 h-3.5 text-[#00F0FF]" />
                <span className="text-xs text-[#888899]">Webhooks</span>
              </div>
              <div className="w-24 h-2 rounded bg-[rgba(51,51,51,0.5)]" />
            </div>
            <div className="px-4 py-3 rounded-lg border border-[rgba(51,51,51,0.4)] bg-[rgba(10,10,14,0.6)] backdrop-blur-md opacity-60">
              <div className="flex items-center gap-2 mb-1.5">
                <FileText className="w-3.5 h-3.5 text-[#BF40FF]" />
                <span className="text-xs text-[#888899]">Documentação</span>
              </div>
              <div className="w-24 h-2 rounded bg-[rgba(51,51,51,0.5)]" />
            </div>
          </div>

          {/* CTA Button */}
          <button
            className="mt-8 flex items-center gap-2 px-6 py-3 rounded-lg
              bg-[rgba(0,255,65,0.12)] border border-[rgba(0,255,65,0.35)]
              text-[#00FF41] font-semibold text-sm
              hover:bg-[rgba(0,255,65,0.2)] hover:border-[rgba(0,255,65,0.5)]
              transition-all duration-200 cyber-mono"
          >
            <Shield className="w-4 h-4" />
            Solicitar Upgrade
            <ArrowRight className="w-4 h-4" />
          </button>
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
                Esta chave não será mostrada novamente.
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
          <h3 className="text-sm font-semibold text-[#E0E0E8]">Gerar Nova Chave</h3>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Label (opcional)"
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
          <p className="text-xs text-[#555566]">
            Nenhuma chave API registada. Crie a sua primeira chave acima.
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
                  <span className="text-[10px] text-[#555566] cyber-mono">
                    {formatDate(k.created_at)}
                  </span>
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
      await api.users.updateMe({ webhook_url: webhookUrl });
      setSuccess('Webhook URL atualizada com sucesso.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar webhook.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="w-5 h-5 text-[#00FF41] animate-spin" />
        <span className="ml-3 text-xs cyber-mono text-[#555566]">
          LOADING WEBHOOK CONFIG...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
      <div className="cyber-panel p-4 border border-[rgba(51,51,51,0.6)]">
        <div className="flex items-center gap-2 mb-3">
          <Webhook className="w-4 h-4 text-[#00F0FF]" />
          <h3 className="text-sm font-semibold text-[#E0E0E8]">Webhook URL</h3>
        </div>
        <p className="text-xs text-[#888899] mb-3">
          Receba notificações em tempo real sobre eventos na sua conta. Cada pedido é assinado com HMAC-SHA256.
        </p>
        <div className="flex gap-2">
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://exemplo.com/webhook/nexflowx"
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
      <div className="cyber-panel p-4 border border-[rgba(51,51,51,0.6)]">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-[#BF40FF]" />
          <h3 className="text-sm font-semibold text-[#E0E0E8]">HMAC Secret</h3>
        </div>
        <p className="text-xs text-[#888899] mb-3">
          Use este segredo para verificar a assinatura dos webhooks recebidos.
        </p>
        {hmacSecret ? (
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs cyber-mono text-[#BF40FF] bg-[rgba(0,0,0,0.3)] px-3 py-2 rounded border border-[rgba(191,64,255,0.2)] break-all">
              {hmacSecret}
            </code>
            <button
              onClick={() => copyToClipboard(hmacSecret)}
              className="shrink-0 p-2 rounded-lg border border-[rgba(51,51,51,0.5)] text-[#555566] hover:text-[#E0E0E8] transition-colors"
              title="Copiar"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <p className="text-xs text-[#555566] italic">
            Nenhum segredo HMAC disponível. Defina uma webhook URL primeiro.
          </p>
        )}
      </div>

      {/* Events guide */}
      <div className="cyber-panel p-4 border border-[rgba(51,51,51,0.4)]">
        <h4 className="text-xs font-semibold text-[#888899] mb-2 cyber-mono">
          EVENTOS SUPORTADOS
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { event: 'wallet.credit', desc: 'Crédito em carteira' },
            { event: 'wallet.debit', desc: 'Débito em carteira' },
            { event: 'swap.completed', desc: 'Conversão FX concluída' },
            { event: 'payout.created', desc: 'Levantamento criado' },
            { event: 'payout.completed', desc: 'Levantamento processado' },
            { event: 'payout.failed', desc: 'Levantamento falhado' },
          ].map((e) => (
            <div
              key={e.event}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(10,10,14,0.4)] border border-[rgba(51,51,51,0.3)]"
            >
              <ChevronRight className="w-3 h-3 text-[#00FF41]" />
              <code className="text-[11px] cyber-mono text-[#00F0FF]">{e.event}</code>
              <span className="text-[10px] text-[#555566] ml-auto">{e.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Documentation Tab ──────────────────────────────────────────────────────

function DocumentationTab() {
  return (
    <div className="space-y-6">
      {/* Authentication */}
      <div className="cyber-panel p-4 border border-[rgba(51,51,51,0.6)]">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-[#00FF41]" />
          <h3 className="text-sm font-semibold text-[#E0E0E8]">Autenticação</h3>
        </div>
        <p className="text-xs text-[#888899] mb-3">
          Todas as chamadas API requerem um header de autorização Bearer JWT. Obtenha o seu token via <code className="text-[#00F0FF]">POST /auth/login</code>.
        </p>
        <div className="bg-[rgba(0,0,0,0.4)] rounded-lg border border-[rgba(51,51,51,0.5)] p-3 overflow-x-auto">
          <pre className="text-xs cyber-mono text-[#00FF41]">
{`curl -X POST https://api-dev.nexflowx.tech/api/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username": "user@example.com", "password": "***"}'

# Response: { "token": "eyJhbG...", "user": { ... } }

# Usar em chamadas subsequentes:
curl https://api-dev.nexflowx.tech/api/v1/wallets \\
  -H "Authorization: Bearer eyJhbG..."`}
          </pre>
        </div>
      </div>

      {/* Endpoints — Wallets */}
      <div className="cyber-panel p-4 border border-[rgba(51,51,51,0.6)]">
        <div className="flex items-center gap-2 mb-3">
          <Terminal className="w-4 h-4 text-[#00F0FF]" />
          <h3 className="text-sm font-semibold text-[#E0E0E8]">Endpoints — Carteiras</h3>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="cyber-badge cyber-badge-green text-[9px]">GET</span>
              <code className="text-xs cyber-mono text-[#E0E0E8]">/wallets</code>
            </div>
            <p className="text-[11px] text-[#888899] ml-14">Listar todas as carteiras do merchant.</p>
          </div>

          <div className="bg-[rgba(0,0,0,0.4)] rounded-lg border border-[rgba(51,51,51,0.5)] p-3 overflow-x-auto">
            <pre className="text-xs cyber-mono text-[#E0E0E8]">
{`GET /wallets
Authorization: Bearer eyJhbG...

Response 200:
{
  "data": [
    {
      "id": "wal_abc123",
      "currency_code": "EUR",
      "type": "merchant",
      "balance_total": 10500.50,
      "balance_available": 10000.00
    }
  ]
}`}
            </pre>
          </div>
        </div>
      </div>

      {/* Endpoints — Swap */}
      <div className="cyber-panel p-4 border border-[rgba(51,51,51,0.6)]">
        <div className="flex items-center gap-2 mb-3">
          <ArrowRight className="w-4 h-4 text-[#FFB800]" />
          <h3 className="text-sm font-semibold text-[#E0E0E8]">Endpoints — Swap FX</h3>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="cyber-badge cyber-badge-amber text-[9px]">POST</span>
              <code className="text-xs cyber-mono text-[#E0E0E8]">/swap</code>
            </div>
            <p className="text-[11px] text-[#888899] ml-14">Converter moedas entre carteiras.</p>
          </div>

          <div className="bg-[rgba(0,0,0,0.4)] rounded-lg border border-[rgba(51,51,51,0.5)] p-3 overflow-x-auto">
            <pre className="text-xs cyber-mono text-[#E0E0E8]">
{`POST /swap
Authorization: Bearer eyJhbG...
Content-Type: application/json

{
  "amount": 1000,
  "from_currency": "EUR",
  "to_currency": "USD"
}

Response 200:
{
  "success": true,
  "converted": 1085.42,
  "fee": 2.50,
  "rate": 1.0879
}`}
            </pre>
          </div>
        </div>
      </div>

      {/* Endpoints — Payout */}
      <div className="cyber-panel p-4 border border-[rgba(51,51,51,0.6)]">
        <div className="flex items-center gap-2 mb-3">
          <Code className="w-4 h-4 text-[#BF40FF]" />
          <h3 className="text-sm font-semibold text-[#E0E0E8]">Endpoints — Levantamentos</h3>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="cyber-badge cyber-badge-amber text-[9px]">POST</span>
              <code className="text-xs cyber-mono text-[#E0E0E8]">/payout</code>
            </div>
            <p className="text-[11px] text-[#888899] ml-14">Solicitar levantamento (IBAN, PIX, SEPA, etc.).</p>
          </div>

          <div className="bg-[rgba(0,0,0,0.4)] rounded-lg border border-[rgba(51,51,51,0.5)] p-3 overflow-x-auto">
            <pre className="text-xs cyber-mono text-[#E0E0E8]">
{`POST /payout
Authorization: Bearer eyJhbG...
Content-Type: application/json

{
  "amount": 500,
  "currency": "EUR",
  "method": "IBAN",
  "destination": "PT50123456789012345678901"
}

Response 200:
{
  "success": true,
  "message": "Payout request submitted for review."
}`}
            </pre>
          </div>
        </div>
      </div>

      {/* Endpoints — Ledger */}
      <div className="cyber-panel p-4 border border-[rgba(51,51,51,0.6)]">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-[#00FF41]" />
          <h3 className="text-sm font-semibold text-[#E0E0E8]">Endpoints — Ledger</h3>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="cyber-badge cyber-badge-green text-[9px]">GET</span>
              <code className="text-xs cyber-mono text-[#E0E0E8]">/ledger?page=1&limit=20</code>
            </div>
            <p className="text-[11px] text-[#888899] ml-14">Histórico financeiro paginado.</p>
          </div>
        </div>
      </div>

      {/* Error Codes */}
      <div className="cyber-panel p-4 border border-[rgba(51,51,51,0.6)]">
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
                { code: 'FORBIDDEN', status: 403, desc: 'Sem permissão para este recurso' },
                { code: 'INSUFFICIENT_BALANCE', status: 400, desc: 'Saldo insuficiente para a operação' },
                { code: 'INVALID_CURRENCY', status: 400, desc: 'Moeda não suportada' },
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
    </div>
  );
}

// ─── Full Developer Hub (Merchant + Admin) ──────────────────────────────────

function DeveloperHub() {
  return (
    <Tabs defaultValue="api-keys" className="space-y-4">
      <TabsList className="bg-[rgba(10,10,14,0.6)] border border-[rgba(51,51,51,0.5)] p-1">
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
          <FileText className="w-3.5 h-3.5 mr-1.5" />
          Documentação
        </TabsTrigger>
      </TabsList>

      <TabsContent value="api-keys">
        <ApiKeysTab />
      </TabsContent>
      <TabsContent value="webhooks">
        <WebhooksTab />
      </TabsContent>
      <TabsContent value="docs">
        <DocumentationTab />
      </TabsContent>
    </Tabs>
  );
}

// ─── Main Component (RBAC Router) ──────────────────────────────────────────

export default function ApiManagement() {
  const { user } = useAuthStore();

  // Customer → locked state
  if (isCustomer(user)) {
    return <LockedDeveloperHub />;
  }

  // Merchant + Admin → full developer hub
  return <DeveloperHub />;
}
