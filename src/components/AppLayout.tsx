import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderOpen,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { NotificationBell } from './NotificationBell';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderOpen, label: 'Projetos' },
  { to: '/analytics', icon: BarChart3, label: 'Análises Globais' },
  { to: '/settings', icon: Settings, label: 'Configurações' },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('surveyForge_user');
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F1EFE8]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static z-40 h-full flex flex-col transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          w-64 flex-shrink-0`}
        style={{ background: 'linear-gradient(180deg, #2D1E6B 0%, #1e1549 100%)' }}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1D9E75] flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">SF</span>
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                SurveyForge
              </p>
              <p className="text-[#1D9E75] text-[10px] uppercase tracking-widest">Clarifyse</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                  ${isActive
                    ? 'bg-white/15 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={18} className={isActive ? 'text-[#1D9E75]' : ''} />
                    <span className="flex-1">{item.label}</span>
                    {isActive && <ChevronRight size={14} className="text-[#1D9E75]" />}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#7F77DD] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">Admin Clarifyse</p>
              <p className="text-white/40 text-[10px] truncate">admin@clarifyse.com</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-white/50 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-white/10 transition-colors w-full"
          >
            <LogOut size={13} />
            Sair
          </button>
          <p className="text-[#1D9E75] text-[9px] uppercase tracking-widest mt-3 text-center opacity-70">
            Where questions become clarity.
          </p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-white/20 flex-shrink-0"
          style={{ background: 'linear-gradient(90deg, #2D1E6B 0%, #3d2a8a 100%)' }}>
          <button
            className="md:hidden p-2 text-white/80 hover:text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <NotificationBell />
          <div className="w-8 h-8 rounded-full bg-[#7F77DD] flex items-center justify-center">
            <span className="text-white text-xs font-bold">A</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
