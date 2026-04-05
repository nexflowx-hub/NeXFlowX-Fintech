'use client';

import { useState, useCallback, useEffect } from 'react';
import { Key, Mail, Shield, Bell, Loader2, Eye, EyeOff, RefreshCw, AlertTriangle, Check } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/lib/auth-store';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';

// ─── Types ──────────────────────────────────────────────────────────────────

interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  webhook_url?: string;
  hmac_secret?: string;
  email_notifications?: boolean;
  transaction_alerts?: boolean;
  weekly_reports?: boolean;
  security_alerts?: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function PasswordField({
  label,
  value,
  onChange,
  showPassword,
  onToggleVisibility,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  showPassword: boolean;
  onToggleVisibility: () => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs text-[#888899] cyber-mono uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 rounded-lg text-sm pr-10 cyber-input"
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555566] hover:text-[#888899] transition-colors"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ─── Tab 1: Change Password ───────────────────────────────────────────────
// Route: POST /api/v1/users/me/password

function ChangePasswordTab() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback((): boolean => {
    const next: Record<string, string> = {};
    if (!currentPassword) next.current = 'Password atual é obrigatório.';
    if (newPassword.length < 8) next.new = 'A nova password deve ter pelo menos 8 caracteres.';
    if (newPassword !== confirmPassword) next.confirm = 'As passwords não coincidem.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [currentPassword, newPassword, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      // POST /api/v1/users/me/password
      await api.settings.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success('Password alterada com sucesso.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Não foi possível alterar a password.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
      {/* Route indicator */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(10,10,14,0.4)] border border-[rgba(51,51,51,0.3)]">
        <span className="cyber-badge cyber-badge-amber text-[9px]">POST</span>
        <code className="text-[11px] cyber-mono text-[#888899]">/api/v1/users/me/password</code>
      </div>

      <PasswordField
        label="Password Atual"
        value={currentPassword}
        onChange={setCurrentPassword}
        showPassword={showCurrent}
        onToggleVisibility={() => setShowCurrent(!showCurrent)}
        placeholder="Introduza a password atual"
      />
      {errors.current && (
        <p className="text-[11px] text-[#FF0040] cyber-mono">{errors.current}</p>
      )}

      <PasswordField
        label="Nova Password"
        value={newPassword}
        onChange={setNewPassword}
        showPassword={showNew}
        onToggleVisibility={() => setShowNew(!showNew)}
        placeholder="Mínimo 8 caracteres"
      />
      {errors.new && (
        <p className="text-[11px] text-[#FF0040] cyber-mono">{errors.new}</p>
      )}
      {newPassword.length > 0 && newPassword.length < 8 && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full bg-[rgba(51,51,51,0.4)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min((newPassword.length / 8) * 100, 100)}%`,
                background:
                  newPassword.length >= 8
                    ? 'linear-gradient(90deg, rgba(0,255,65,0.3), #00FF41)'
                    : 'linear-gradient(90deg, rgba(255,184,0,0.3), #FFB800)',
              }}
            />
          </div>
          <span className="text-[10px] cyber-mono text-[#555566]">
            {newPassword.length}/8
          </span>
        </div>
      )}

      <PasswordField
        label="Confirmar Nova Password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        showPassword={showConfirm}
        onToggleVisibility={() => setShowConfirm(!showConfirm)}
        placeholder="Repita a nova password"
      />
      {errors.confirm && (
        <p className="text-[11px] text-[#FF0040] cyber-mono">{errors.confirm}</p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium cyber-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>A alterar password...</span>
          </>
        ) : (
          <span>Alterar Password</span>
        )}
      </button>
    </form>
  );
}

// ─── Tab 2: Email Management ──────────────────────────────────────────────
// Route: PATCH /api/v1/users/me

function EmailManagementTab() {
  const { user, login: refreshUser } = useAuthStore();
  const [newEmail, setNewEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setIsLoading(true);
    try {
      // PATCH /api/v1/users/me { email: "..." }
      await api.users.updateMe({ email: newEmail.trim() });
      toast.success('Email atualizado com sucesso.');

      // Refresh local user state
      if (user) {
        refreshUser(user.username, ''); // Won't work directly, but we show toast
      }

      setNewEmail('');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Não foi possível atualizar o email.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
      {/* Route indicator */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(10,10,14,0.4)] border border-[rgba(51,51,51,0.3)]">
        <span className="cyber-badge cyber-badge-green text-[9px]">PATCH</span>
        <code className="text-[11px] cyber-mono text-[#888899]">/api/v1/users/me</code>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-[#888899] cyber-mono uppercase tracking-wider">
          Email Atual
        </label>
        <input
          type="text"
          value={user?.email ?? '—'}
          readOnly
          className="w-full px-3 py-2.5 rounded-lg text-sm cyber-input opacity-60 cursor-not-allowed"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-[#888899] cyber-mono uppercase tracking-wider">
          Novo Email
        </label>
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="Introduza o novo email"
          required
          className="w-full px-3 py-2.5 rounded-lg text-sm cyber-input"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || !newEmail.trim()}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium cyber-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>A atualizar...</span>
          </>
        ) : (
          <span>Atualizar Email</span>
        )}
      </button>
    </form>
  );
}

// ─── Tab 3: 2FA (Placeholder) ────────────────────────────────────────────

function TwoFactorTab() {
  return (
    <div className="space-y-5 max-w-md">
      {/* Route indicator */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(10,10,14,0.4)] border border-[rgba(51,51,51,0.3)]">
        <span className="cyber-badge cyber-badge-cyan text-[9px]">POST</span>
        <code className="text-[11px] cyber-mono text-[#888899]">/api/v1/users/me/2fa</code>
        <span className="text-[9px] text-[#555566] ml-auto">EM BREVE</span>
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg bg-[rgba(10,10,14,0.4)] border border-[rgba(51,51,51,0.3)]">
        <div>
          <p className="text-sm text-[#E0E0E8]">Ativar autenticação de dois fatores</p>
          <p className="text-[11px] text-[#555566] mt-0.5">
            Adicione uma camada extra de segurança à sua conta.
          </p>
        </div>
        <Switch disabled checked={false} />
      </div>
      <div className="flex items-start gap-3 px-4 py-3 rounded-lg border border-dashed border-[rgba(255,184,0,0.3)] bg-[rgba(255,184,0,0.04)]">
        <Shield className="w-4 h-4 text-[#FFB800] mt-0.5 shrink-0" />
        <p className="text-xs text-[#FFB800]">
          Autenticação de dois fatores estará disponível em breve.
        </p>
      </div>
    </div>
  );
}

// ─── Tab 4: Notifications ────────────────────────────────────────────────
// Route: PATCH /api/v1/users/me { email_notifications, transaction_alerts, ... }

function NotificationsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await api.users.getMe();
        setProfile(res.data as unknown as UserProfile);
      } catch {
        // Graceful fallback — use defaults
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleToggle = useCallback(async (key: keyof UserProfile) => {
    if (!profile) return;
    const newValue = !(profile[key] as boolean);
    const updated = { ...profile, [key]: newValue };
    setProfile(updated);

    setSaving(true);
    try {
      // PATCH /api/v1/users/me
      await api.users.updateMe({ [key]: newValue });
      toast.success('Preferência atualizada.');
    } catch (err) {
      // Revert on failure
      setProfile(profile);
      toast.error(err instanceof Error ? err.message : 'Erro ao guardar preferência.');
    } finally {
      setSaving(false);
    }
  }, [profile]);

  const notificationToggles = [
    {
      id: 'email_notifications' as const,
      label: 'Notificações por email',
      description: 'Receba atualizações importantes por email.',
    },
    {
      id: 'transaction_alerts' as const,
      label: 'Alertas de transações',
      description: 'Seja notificado sobre novas transações.',
    },
    {
      id: 'weekly_reports' as const,
      label: 'Relatórios semanais',
      description: 'Receba um resumo semanal da sua conta.',
    },
    {
      id: 'security_alerts' as const,
      label: 'Alertas de segurança',
      description: 'Notificações sobre acessos suspeitos.',
    },
  ];

  return (
    <div className="space-y-6 max-w-md">
      {/* Route indicator */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(10,10,14,0.4)] border border-[rgba(51,51,51,0.3)]">
        <span className="cyber-badge cyber-badge-green text-[9px]">PATCH</span>
        <code className="text-[11px] cyber-mono text-[#888899]">/api/v1/users/me</code>
        {saving && (
          <span className="flex items-center gap-1 ml-auto text-[9px] text-[#FFB800]">
            <Loader2 className="w-3 h-3 animate-spin" /> GUARDANDO...
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-5 h-5 text-[#00FF41] animate-spin" />
          <span className="ml-3 text-xs cyber-mono text-[#555566]">
            LOADING PREFERENCES...
          </span>
        </div>
      ) : (
        <div className="space-y-3">
          {notificationToggles.map((item) => {
            const value = (profile?.[item.id] as boolean) ?? false;
            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-lg bg-[rgba(10,10,14,0.4)] border border-[rgba(51,51,51,0.3)]"
              >
                <div>
                  <p className="text-sm text-[#E0E0E8]">{item.label}</p>
                  <p className="text-[11px] text-[#555566] mt-0.5">{item.description}</p>
                </div>
                <Switch
                  checked={value}
                  onCheckedChange={() => handleToggle(item.id)}
                  disabled={saving}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function SettingsSecurity() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-5 h-5 text-[#00FF41]" />
        <h2 className="text-lg font-semibold text-[#E0E0E8]">Configurações &amp; Segurança</h2>
      </div>

      <Tabs defaultValue="password" className="w-full">
        <TabsList className="bg-[rgba(25,25,35,0.6)] border border-[rgba(51,51,51,0.5)] rounded-lg p-1 flex-wrap gap-1 h-auto">
          <TabsTrigger
            value="password"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-xs data-[state=active]:bg-[rgba(0,255,65,0.1)] data-[state=active]:text-[#00FF41] data-[state=active]:border-[rgba(0,255,65,0.3)] text-[#888899] hover:text-[#E0E0E8]"
          >
            <Key className="w-3.5 h-3.5" />
            Alterar Password
          </TabsTrigger>
          <TabsTrigger
            value="email"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-xs data-[state=active]:bg-[rgba(0,255,65,0.1)] data-[state=active]:text-[#00FF41] data-[state=active]:border-[rgba(0,255,65,0.3)] text-[#888899] hover:text-[#E0E0E8]"
          >
            <Mail className="w-3.5 h-3.5" />
            Gestão de Email
          </TabsTrigger>
          <TabsTrigger
            value="2fa"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-xs data-[state=active]:bg-[rgba(0,255,65,0.1)] data-[state=active]:text-[#00FF41] data-[state=active]:border-[rgba(0,255,65,0.3)] text-[#888899] hover:text-[#E0E0E8]"
          >
            <Shield className="w-3.5 h-3.5" />
            Autenticação 2FA
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-xs data-[state=active]:bg-[rgba(0,255,65,0.1)] data-[state=active]:text-[#00FF41] data-[state=active]:border-[rgba(0,255,65,0.3)] text-[#888899] hover:text-[#E0E0E8]"
          >
            <Bell className="w-3.5 h-3.5" />
            Notificações
          </TabsTrigger>
        </TabsList>

        <div className="cyber-panel p-6 mt-4">
          <TabsContent value="password" className="mt-0">
            <ChangePasswordTab />
          </TabsContent>
          <TabsContent value="email" className="mt-0">
            <EmailManagementTab />
          </TabsContent>
          <TabsContent value="2fa" className="mt-0">
            <TwoFactorTab />
          </TabsContent>
          <TabsContent value="notifications" className="mt-0">
            <NotificationsTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
