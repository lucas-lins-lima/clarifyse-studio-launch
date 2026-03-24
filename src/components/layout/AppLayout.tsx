import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Loader2 } from 'lucide-react';
import { SurveyForgeNotificationsBell } from '@/components/notifications/SurveyForgeNotificationsBell';

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

  if (!allowedRoles.includes(profile.role)) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-16 flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-md px-6 sticky top-0 z-30">
            <SidebarTrigger className="text-primary" />
            <div className="flex items-center gap-3">
              <SurveyForgeNotificationsBell />
              <div className="w-px h-6 bg-border" />
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-foreground">{profile.name}</p>
                <p className="text-[10px] text-secondary font-bold uppercase tracking-wider">{profile.role}</p>
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 p-6 md:p-10 overflow-auto">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
