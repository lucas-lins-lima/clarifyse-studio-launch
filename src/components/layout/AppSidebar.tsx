import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderOpen,
  BarChart3,
  Settings,
  LogOut,
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
import { cn } from '@/lib/utils';

const allMenuItems = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard, roles: ['admin', 'pesquisador'] },
  { title: 'Projetos', url: '/admin/projetos', icon: FolderOpen, roles: ['admin', 'pesquisador'] },
  { title: 'Análises Globais', url: '/admin/analises', icon: BarChart3, roles: ['admin'] },
  { title: 'Configurações', url: '/admin/configuracoes', icon: Settings, roles: ['admin', 'pesquisador'] },
  
  // Client items
  { title: 'Meus Projetos', url: '/cliente', icon: LayoutDashboard, roles: ['cliente'] },
  { title: 'Sobre a Clarifyse', url: '/cliente/sobre', icon: Settings, roles: ['cliente'] },

  // Manager items
  { title: 'Dashboard', url: '/gerente', icon: LayoutDashboard, roles: ['gerente'] },
  { title: 'Financeiro', url: '/gerente/financeiro', icon: BarChart3, roles: ['gerente'] },
];

export function AppSidebar() {
  const { profile, signOut } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const menuItems = allMenuItems.filter(item =>
    profile?.role && item.roles.includes(profile.role)
  );

  return (
    <Sidebar collapsible="icon" className="border-r-0 bg-sidebar-background">
      <div className="flex items-center gap-3 px-6 py-8">
        <img src={logo} alt="Clarifyse" className="h-8 object-contain flex-shrink-0" style={{ filter: 'brightness(0) invert(1)' }} />
        {!collapsed && (
          <span className="text-lg font-display font-bold text-white truncate">
            SurveyForge
          </span>
        )}
      </div>

      <SidebarContent className="px-4 py-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/admin'}
                      className={({ isActive }) => cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                        isActive
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-lg shadow-sidebar-primary/20'
                          : 'text-sidebar-foreground/70 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground'
                      )}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-4 py-6 mt-auto">
        {!collapsed && profile && (
          <div className="mb-4 px-4 py-3 bg-sidebar-foreground/5 rounded-xl border border-sidebar-foreground/10">
            <p className="text-xs font-bold text-sidebar-foreground truncate">{profile.name}</p>
            <p className="text-[10px] text-sidebar-foreground/50 truncate uppercase tracking-wider mt-0.5">
              {profile.role === 'admin' ? 'Administrador' : 
               profile.role === 'pesquisador' ? 'Pesquisador' :
               profile.role === 'gerente' ? 'Gerente' : 'Cliente'}
            </p>
          </div>
        )}
        <Button
          variant="ghost"
          size={collapsed ? 'icon' : 'sm'}
          onClick={signOut}
          className="w-full text-white/60 hover:text-white hover:bg-white/10 justify-start gap-3 px-4 h-12 rounded-xl"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
