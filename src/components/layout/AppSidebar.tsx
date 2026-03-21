import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  FileText,
  Users,
  TrendingUp,
  Settings,
  PlusCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import logo from "@/assets/clarifyse-logo.png";
import { cn } from "@/lib/utils";

interface SidebarProps {
  userRole?: "admin" | "pesquisador";
}

const adminMenu = [
  { icon: BarChart3, label: "Dashboard", path: "/dashboard" },
  { icon: FileText, label: "Projetos", path: "/projetos" },
  { icon: Users, label: "Pesquisadores", path: "/pesquisadores" },
  { icon: TrendingUp, label: "Análises", path: "/analises" },
  { icon: Settings, label: "Configurações", path: "/configuracoes" },
];

const researcherMenu = [
  { icon: BarChart3, label: "Dashboard", path: "/dashboard" },
  { icon: FileText, label: "Meus Projetos", path: "/projetos" },
  { icon: PlusCircle, label: "Criar Projeto", path: "/projetos/novo" },
  { icon: TrendingUp, label: "Análises", path: "/analises" },
];

const AppSidebar = ({ userRole = "admin" }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const menu = userRole === "admin" ? adminMenu : researcherMenu;

  return (
    <aside
      className={cn(
        "flex h-screen flex-col bg-sidebar text-sidebar-foreground transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && <img src={logo} alt="Clarifyse" className="h-8" />}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-md p-1 hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {menu.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon size={20} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User / Logout */}
      <div className="border-t border-sidebar-border p-3">
        {!collapsed && (
          <div className="mb-2 px-2">
            <p className="text-sm font-medium text-sidebar-foreground">Administrador</p>
            <p className="text-xs text-sidebar-foreground/50 truncate">admin@clarifyse.com</p>
          </div>
        )}
        <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
          <LogOut size={18} />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
