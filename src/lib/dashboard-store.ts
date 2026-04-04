import { create } from 'zustand';

export type DashboardSection =
  | 'dashboard'
  | 'wallets'
  | 'swap'
  | 'payouts'
  | 'activity'
  | 'settings'
  | 'approvals'    // Admin only
  | 'liquidity';   // Admin only

interface DashboardStore {
  activeSection: DashboardSection;
  sidebarCollapsed: boolean;
  setActiveSection: (section: DashboardSection) => void;
  toggleSidebar: () => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  activeSection: 'dashboard',
  sidebarCollapsed: false,
  setActiveSection: (section) => set({ activeSection: section }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));
