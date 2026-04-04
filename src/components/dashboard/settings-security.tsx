'use client';

import { useState, useCallback } from 'react';
import { Key, Mail, Shield, Bell, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/lib/auth-store';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';

// ─── Helpers ───────────────────────────────────────────────────────────────

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

function EmailManagementTab() {
  const user = useAuthStore((s) => s.user);
  const [newEmail, setNewEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setIsLoading(true);
    try {
      await api.settings.updateEmail({ email: newEmail.trim() });
      toast.success('Email atualizado com sucesso.');
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

// ─── Tab 4: Notifications (Placeholder) ──────────────────────────────────

const notificationToggles = [
  {
    id: 'email_notifications',
    label: 'Notificações por email',
    description: 'Receba atualizações importantes por email.',
  },
  {
    id: 'transaction_alerts',
    label: 'Alertas de transações',
    description: 'Seja notificado sobre novas transações.',
  },
  {
    id: 'weekly_reports',
    label: 'Relatórios semanais',
    description: 'Receba um resumo semanal da sua conta.',
  },
  {
    id: 'security_alerts',
    label: 'Alertas de segurança',
    description: 'Notificações sobre acessos suspeitos.',
  },
];

function NotificationsTab() {
  return (
    <div className="space-y-6 max-w-md">
      <div className="space-y-3">
        {notificationToggles.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-4 rounded-lg bg-[rgba(10,10,14,0.4)] border border-[rgba(51,51,51,0.3)]"
          >
            <div>
              <p className="text-sm text-[#E0E0E8]">{item.label}</p>
              <p className="text-[11px] text-[#555566] mt-0.5">{item.description}</p>
            </div>
            <Switch disabled checked={false} />
          </div>
        ))}
      </div>
      <div className="flex items-start gap-3 px-4 py-3 rounded-lg border border-dashed border-[rgba(255,184,0,0.3)] bg-[rgba(255,184,0,0.04)]">
        <Bell className="w-4 h-4 text-[#FFB800] mt-0.5 shrink-0" />
        <p className="text-xs text-[#FFB800]">
          As preferências de notificação serão configuráveis em breve.
        </p>
      </div>
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
