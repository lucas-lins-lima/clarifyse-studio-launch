import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  Target,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import logo from '@/assets/logo.png';
import { Button } from '@/components/ui/button';

const adminMenu = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
  { title: 'Projetos', url: '/admin/projetos', icon: FolderOpen },
  { title: 'Clientes', url: '/admin/clientes', icon: Users },
  { title: 'Financeiro', url: '/admin/financeiro', icon: DollarSign },
  { title: 'KPIs', url: '/admin/kpis', icon: BarChart3 },
  { title: 'Metas', url: '/admin/metas', icon: Target },
  { title: 'Configurações', url: '/admin/configuracoes', icon: Settings },
];

const gerenteMenu = [
  { title: 'Dashboard', url: '/gerente', icon: LayoutDashboard },
  { title: 'Projetos', url: '/gerente/projetos', icon: FolderOpen },
  { title: 'Clientes', url: '/gerente/clientes', icon: Users },
  { title: 'Financeiro', url: '/gerente/financeiro', icon: DollarSign },
];

const clienteMenu = [
  { title: 'Meus Projetos', url: '/cliente', icon: FolderOpen },
  { title: 'Sobre a Clarifyse', url: '/cliente/sobre', icon: Target },
];

export function AppSidebar() {
  const { profile, signOut } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();

  const role = profile?.role;
  const menuItems = role === 'admin' ? adminMenu : role === 'gerente' ? gerenteMenu : clienteMenu;

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-sidebar-border">
        <img src={logo} alt="Clarifyse" className="h-8 object-contain flex-shrink-0" />
        {!collapsed && (
          <span className="text-sm font-semibold text-sidebar-foreground truncate">
            Clarifyse
          </span>
        )}
      </div>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/admin' || item.url === '/gerente' || item.url === '/cliente'}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-3 py-3">
        {!collapsed && profile && (
          <div className="mb-2 px-2">
            <p className="text-xs font-medium text-sidebar-foreground truncate">{profile.name}</p>
            <p className="text-xs text-sidebar-foreground/50 truncate">{profile.email}</p>
          </div>
        )}
        <Button
          variant="ghost"
          size={collapsed ? 'icon' : 'sm'}
          onClick={signOut}
          className="w-full text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent justify-start gap-2"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
