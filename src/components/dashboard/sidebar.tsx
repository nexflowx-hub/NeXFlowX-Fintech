'use client';

import React from 'react';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Banknote,
  List,
  Settings,
  ShieldCheck,
  Building2,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { useDashboardStore, type DashboardSection } from '@/lib/dashboard-store';
import { useAuthStore, isAdmin } from '@/lib/auth-store';

interface NavItem {
  id: DashboardSection;
  label: string;
  icon: React.ReactNode;
  description: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="w-4 h-4" />,
    description: '💰 Visão geral financeira',
  },
  {
    id: 'wallets',
    label: 'Wallets',
    icon: <Wallet className="w-4 h-4" />,
    description: '👛 Carteiras digitais',
  },
  {
    id: 'swap',
    label: 'Swap FX',
    icon: <ArrowLeftRight className="w-4 h-4" />,
    description: '🔄 Conversão de moedas',
  },
  {
    id: 'payouts',
    label: 'Levantamentos',
    icon: <Banknote className="w-4 h-4" />,
    description: '💸 Transferências & saques',
  },
  {
    id: 'activity',
    label: 'Atividade',
    icon: <List className="w-4 h-4" />,
    description: '📋 Histórico financeiro',
  },
  {
    id: 'settings',
    label: 'Definições',
    icon: <Settings className="w-4 h-4" />,
    description: '⚙️ Configurações & segurança',
  },
  {
    id: 'approvals',
    label: 'Aprovações',
    icon: <ShieldCheck className="w-4 h-4" />,
    description: '👑 Aprovar operações',
    adminOnly: true,
  },
  {
    id: 'liquidity',
    label: 'Liquidez do Sistema',
    icon: <Building2 className="w-4 h-4" />,
    description: '🏦 Gestão de liquidez',
    adminOnly: true,
  },
];

export default function Sidebar() {
  const { activeSection, setActiveSection, sidebarCollapsed, toggleSidebar } =
    useDashboardStore();
  const { user } = useAuthStore();

  const showAdminItems = isAdmin(user);
  const filteredNavItems = showAdminItems
    ? navItems
    : navItems.filter((item) => !item.adminOnly);

  return (
    <aside
      className={`
        cyber-sidebar fixed left-0 top-0 h-screen z-50 flex flex-col
        transition-all duration-300 ease-in-out
        ${sidebarCollapsed ? 'w-[68px]' : 'w-[260px]'}
      `}
    >
      {/* Logo Section */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-[rgba(51,51,51,0.5)]">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-[rgba(0,255,65,0.2)] to-[rgba(0,255,65,0.05)] border border-[rgba(0,255,65,0.3)] cyber-breathe shrink-0">
          <Zap className="w-5 h-5 text-[#00FF41]" />
        </div>
        {!sidebarCollapsed && (
          <div className="overflow-hidden">
            <h1 className="text-base font-bold tracking-wider text-[#E0E0E8] cyber-mono">
              NeXFlow<span className="text-[#00FF41]">X</span>
            </h1>
            <p className="text-[9px] tracking-[0.2em] text-[#555566] uppercase cyber-mono">
              Core Banking v3.0
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto cyber-scrollbar">
        {filteredNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
              transition-all duration-200 group relative
              ${activeSection === item.id ? 'cyber-sidebar-link active' : 'cyber-sidebar-link'}
            `}
            title={sidebarCollapsed ? item.label : undefined}
          >
            <span
              className={`shrink-0 transition-colors duration-200 ${
                activeSection === item.id
                  ? 'text-[#00FF41]'
                  : item.adminOnly
                    ? 'text-[#FFB800] group-hover:text-[#FFD04A]'
                    : 'text-[#666677] group-hover:text-[#9999AA]'
              }`}
            >
              {item.icon}
            </span>
            {!sidebarCollapsed && (
              <div className="text-left">
                <span className="block text-sm font-medium">{item.label}</span>
                <span className="block text-[10px] text-[#555566] cyber-mono">
                  {item.description}
                </span>
              </div>
            )}
            {!sidebarCollapsed && activeSection === item.id && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <span className="status-dot active" />
              </div>
            )}
          </button>
        ))}
      </nav>

      {/* System Status Footer */}
      <div className="p-3 border-t border-[rgba(51,51,51,0.5)]">
        {!sidebarCollapsed ? (
          <div className="flex items-center gap-2 px-2">
            <span className="status-dot active" />
            <div>
              <p className="text-[10px] cyber-mono text-[#00FF41]">SYSTEM ONLINE</p>
              <p className="text-[9px] cyber-mono text-[#555566]">Uptime: 99.97%</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <span className="status-dot active" />
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full 
          bg-[#0A0A0C] border border-[rgba(51,51,51,0.8)] 
          flex items-center justify-center
          text-[#555566] hover:text-[#00FF41] hover:border-[rgba(0,255,65,0.4)]
          transition-all duration-200 z-50"
      >
        {sidebarCollapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>
    </aside>
  );
}
