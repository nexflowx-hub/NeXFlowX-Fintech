'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import LoginPage from '@/components/login-page';
import DashboardShell from '@/components/dashboard/dashboard-shell';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { isAuthenticated, isLoading, validateToken } = useAuthStore();

  // On mount, validate existing JWT token
  useEffect(() => {
    validateToken();
  }, [validateToken]);

  // Show loading spinner while validating token
  if (isLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0C]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-[#00FF41] animate-spin" />
          <span className="text-xs cyber-mono text-[#555566]">A validar sessão...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <DashboardShell />;
}
