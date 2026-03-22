import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Loader2 } from 'lucide-react';
import { NotificationsBell } from '@/components/notifications/NotificationsBell';

interface AppLayoutProps {
  allowedRoles: string[];
}

export function AppLayout({ allowedRoles }: AppLayoutProps) {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;
  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
  // Force password change
  if (profile.must_change_password) {
    return <Navigate to="/trocar-senha" replace />;
  }
  if (!allowedRoles.includes(profile.role)) {
    const routes: Record<string, string> = {
      admin: '/admin',
      gerente: '/gerente',
      cliente: '/cliente',
    };
    return <Navigate to={routes[profile.role] || '/login'} replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-14 flex items-center justify-between border-b bg-card px-4 sticky top-0 z-30">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <NotificationsBell />
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
