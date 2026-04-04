'use client';

import React, { Suspense, lazy } from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import { useDashboardStore, type DashboardSection } from '@/lib/dashboard-store';
import { useAuthStore } from '@/lib/auth-store';
import Sidebar from '@/components/dashboard/sidebar';
import Header from '@/components/dashboard/header';

/* ── Lazy-loaded section components ── */
const DashboardOverview = lazy(
  () => import('@/components/dashboard/dashboard-overview')
);
const WalletCards = lazy(() => import('@/components/dashboard/wallet-cards'));
const SwapWidget = lazy(() => import('@/components/dashboard/swap-widget'));
const PayoutWidget = lazy(
  () => import('@/components/dashboard/payout-widget')
);
const FinancialActivityTable = lazy(
  () => import('@/components/dashboard/financial-activity-table')
);
const SettingsSecurity = lazy(
  () => import('@/components/dashboard/settings-security')
);
const AdminApprovalTable = lazy(
  () => import('@/components/dashboard/admin-approval-table')
);
const SystemLiquidityPanel = lazy(
  () => import('@/components/dashboard/system-liquidity-panel')
);

/* ── Section label mapping ── */
const sectionLabels: Record<DashboardSection, string> = {
  dashboard: 'PAINEL // FINANCEIRO',
  wallets: 'CARTEIRAS // DIGITAIS',
  swap: 'CONVERSÃO // FX',
  payouts: 'LEVANTAMENTOS // SAQUES',
  activity: 'HISTÓRICO // ATIVIDADE',
  settings: 'CONFIGURAÇÃO // SEGURANÇA',
  approvals: 'APROVAÇÕES // ADMIN',
  liquidity: 'LIQUIDEZ // SISTEMA',
};

/* ── Loading spinner fallback ── */
function SectionLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 className="w-6 h-6 text-[#00FF41] animate-spin" />
      <span className="text-[10px] cyber-mono text-[#555566] tracking-wider">
        LOADING SECTION...
      </span>
    </div>
  );
}

/* ── Section label header ── */
function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[10px] cyber-mono text-[#555566] tracking-wider">
        {label}
      </span>
      <div className="flex-1 h-px bg-[rgba(51,51,51,0.3)]" />
    </div>
  );
}

/* ── Section renderer ── */
function ActiveSection({ section }: { section: DashboardSection }) {
  return (
    <Suspense fallback={<SectionLoader />}>
      <SectionHeader label={sectionLabels[section]} />
      {section === 'dashboard' && <DashboardOverview />}
      {section === 'wallets' && <WalletCards />}
      {section === 'swap' && <SwapWidget />}
      {section === 'payouts' && <PayoutWidget />}
      {section === 'activity' && <FinancialActivityTable />}
      {section === 'settings' && <SettingsSecurity />}
      {section === 'approvals' && <AdminApprovalTable />}
      {section === 'liquidity' && <SystemLiquidityPanel />}
    </Suspense>
  );
}

/* ── Main Shell ── */
export default function DashboardShell() {
  const { activeSection, sidebarCollapsed } = useDashboardStore();
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? 'ml-[68px]' : 'ml-[260px]'
        }`}
      >
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6">
          <ActiveSection section={activeSection} />
        </main>

        {/* Footer */}
        <footer className="mt-auto px-6 py-3 border-t border-[rgba(51,51,51,0.3)] bg-[rgba(10,10,12,0.5)]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] cyber-mono text-[#444455]">
                NeXFlowX™ Core Banking v3.0
              </span>
              <span className="text-[8px] cyber-mono text-[#333]">|</span>
              <span className="text-[10px] cyber-mono text-[#444455]">
                API: /v1
              </span>
              {user && (
                <>
                  <span className="text-[8px] cyber-mono text-[#333]">|</span>
                  <span className="text-[10px] cyber-mono text-[#00FF41]">
                    {user.username}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] cyber-mono text-[#00FF41]">
                ● CORE SECURE
              </span>
              <button
                onClick={logout}
                className="flex items-center gap-1 ml-2 px-2 py-1 rounded border border-[rgba(255,0,64,0.2)] 
                  text-[#555566] hover:text-[#FF0040] hover:border-[rgba(255,0,64,0.4)] hover:bg-[rgba(255,0,64,0.05)] transition-all duration-200"
                title="Terminar sessão"
              >
                <LogOut className="w-3 h-3" />
                <span className="text-[9px] cyber-mono hidden sm:inline">
                  SAIR
                </span>
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
