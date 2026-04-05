'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Search, Shield, Activity, Clock, Crown, User } from 'lucide-react';
import { useDashboardStore, type DashboardSection } from '@/lib/dashboard-store';
import { useAuthStore, getUserRole } from '@/lib/auth-store';

const sectionTitles: Record<DashboardSection, string> = {
  dashboard: 'Painel Financeiro',
  wallets: 'Carteiras',
  swap: 'Conversão FX',
  payouts: 'Levantamentos',
  activity: 'Atividade Financeira',
  settings: 'Definições & Segurança',
  deposits: 'Depósitos',
  developer: 'Developer / API',
  approvals: 'Aprovações',
  liquidity: 'Liquidez do Sistema',
};

const sectionLabels: Record<DashboardSection, string> = {
  dashboard: 'PAINEL // FINANCEIRO',
  wallets: 'CARTEIRAS // DIGITAIS',
  swap: 'CONVERSÃO // FX',
  payouts: 'LEVANTAMENTOS // SAQUES',
  activity: 'HISTÓRICO // ATIVIDADE',
  settings: 'CONFIGURAÇÃO // SEGURANÇA',
  deposits: 'DEPÓSITOS // TOP-UP',
  developer: 'DEVELOPER // API',
  approvals: 'APROVAÇÕES // ADMIN',
  liquidity: 'LIQUIDEZ // SISTEMA',
};

export default function Header() {
  const { activeSection } = useDashboardStore();
  const { user } = useAuthStore();

  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    function tick() {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setDateStr(
        now.toLocaleDateString('pt-BR', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
        })
      );
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const role = getUserRole(user);

  return (
    <header
      className="sticky top-0 z-40 h-14 flex items-center justify-between px-6 
      bg-[rgba(10,10,12,0.8)] backdrop-blur-xl border-b border-[rgba(51,51,51,0.4)]"
    >
      {/* Left: Section Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] cyber-mono text-[#555566] tracking-wider">
            BANK://
          </span>
          <h2 className="text-sm font-semibold text-[#E0E0E8]">
            {sectionTitles[activeSection]}
          </h2>
        </div>
        {/* Role Badge */}
        <div
          className={`hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded cyber-badge ${
            role === 'admin'
              ? 'cyber-badge-amber'
              : role === 'merchant'
                ? 'cyber-badge-green'
                : 'cyber-badge-cyan'
          }`}
        >
          {role === 'admin' ? (
            <Crown className="w-3 h-3" />
          ) : role === 'merchant' ? (
            <Shield className="w-3 h-3" />
          ) : (
            <User className="w-3 h-3" />
          )}
          <span>
            {role === 'admin' ? 'ADMIN' : role === 'merchant' ? 'MERCHANT' : 'CUSTOMER'}
          </span>
        </div>
      </div>

      {/* Center: Search */}
      <div
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg 
        bg-[rgba(15,15,20,0.5)] border border-[rgba(51,51,51,0.5)] 
        w-80 transition-all focus-within:border-[rgba(0,255,65,0.3)]"
      >
        <Search className="w-3.5 h-3.5 text-[#555566]" />
        <input
          type="text"
          placeholder="Pesquisar wallets, transações..."
          className="bg-transparent border-none outline-none text-sm text-[#E0E0E8] placeholder:text-[#444455] w-full"
          readOnly
        />
        <kbd
          className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] 
          bg-[rgba(51,51,51,0.3)] text-[#555566] cyber-mono border border-[rgba(51,51,51,0.5)]"
        >
          ⌘K
        </kbd>
      </div>

      {/* Right: Status & Actions */}
      <div className="flex items-center gap-4">
        {/* Clock & Date */}
        <div className="hidden sm:flex items-center gap-1.5 text-[10px] cyber-mono text-[#555566]">
          <Clock className="w-3 h-3" />
          <span>{dateStr}</span>
          <span className="text-[#888899]">{timeStr}</span>
        </div>

        {/* LIVE Badge */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded cyber-badge-green cyber-badge neon-pulse">
          <Activity className="w-3 h-3" />
          <span>LIVE</span>
        </div>

        {/* Notification Bell */}
        <button className="relative p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.03)] transition-colors">
          <Bell className="w-4 h-4 text-[#666677]" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF0040] rounded-full" />
        </button>

        {/* User Avatar */}
        <div
          className="w-8 h-8 rounded-lg bg-gradient-to-br from-[rgba(0,255,65,0.2)] to-[rgba(0,255,65,0.05)] 
          border border-[rgba(0,255,65,0.3)] flex items-center justify-center"
        >
          <span className="text-xs font-bold text-[#00FF41] cyber-mono">NX</span>
        </div>
      </div>
    </header>
  );
}
