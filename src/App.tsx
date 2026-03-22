import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import React, { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";


// Lazy load pages
const Login = React.lazy(() => import("./pages/Login"));
const AdminDashboard = React.lazy(() => import("./pages/admin/AdminDashboard"));
const GerenteDashboard = React.lazy(() => import("./pages/gerente/GerenteDashboard"));
const ClienteDashboard = React.lazy(() => import("./pages/cliente/ClienteDashboard"));
const ForceChangePassword = React.lazy(() => import("./pages/ForceChangePassword"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const ProjectsPage = React.lazy(() => import("./pages/projects/ProjectsPage"));
const ProjectDetailPage = React.lazy(() => import("./pages/projects/ProjectDetailPage"));
const ClientesPage = React.lazy(() => import("./pages/users/ClientesPage"));
const AdminConfiguracoes = React.lazy(() => import("./pages/admin/AdminConfiguracoes"));
const AdminFinanceiro = React.lazy(() => import("./pages/admin/AdminFinanceiro"));
const GerenteFinanceiro = React.lazy(() => import("./pages/gerente/GerenteFinanceiro"));
const ClienteProjectDetailPage = React.lazy(() => import("./pages/cliente/ClienteProjectDetailPage"));
const AdminKPIs = React.lazy(() => import("./pages/admin/AdminKPIs"));
const AdminMetas = React.lazy(() => import("./pages/admin/AdminMetas"));
const AdminNotifications = React.lazy(() => import("./pages/admin/AdminNotifications"));
const AvaliacaoPage = React.lazy(() => import("./pages/public/AvaliacaoPage"));
const SobreAClarifyse = React.lazy(() => import("./pages/cliente/SobreAClarifyse"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
    },
  },
});

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

const App = () => {
  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/trocar-senha" element={<ForceChangePassword />} />
              <Route path="/avaliacao/:token" element={<AvaliacaoPage />} />

              {/* Admin routes */}
              <Route element={<AppLayout allowedRoles={['admin']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/projetos" element={<ProjectsPage />} />
                <Route path="/admin/projetos/:id" element={<ProjectDetailPage />} />
                <Route path="/admin/clientes" element={<ClientesPage />} />
                <Route path="/admin/financeiro" element={<AdminFinanceiro />} />
                <Route path="/admin/kpis" element={<AdminKPIs />} />
                <Route path="/admin/metas" element={<AdminMetas />} />
                <Route path="/admin/notificacoes" element={<AdminNotifications />} />
                <Route path="/admin/configuracoes" element={<AdminConfiguracoes />} />
              </Route>

              {/* Gerente routes */}
              <Route element={<AppLayout allowedRoles={['gerente']} />}>
                <Route path="/gerente" element={<GerenteDashboard />} />
                <Route path="/gerente/projetos" element={<ProjectsPage />} />
                <Route path="/gerente/projetos/:id" element={<ProjectDetailPage />} />
                <Route path="/gerente/clientes" element={<ClientesPage />} />
                <Route path="/gerente/financeiro" element={<GerenteFinanceiro />} />
                <Route path="/gerente/notificacoes" element={<AdminNotifications />} />
              </Route>

              {/* Cliente routes */}
              <Route element={<AppLayout allowedRoles={['cliente']} />}>
                <Route path="/cliente" element={<ClienteDashboard />} />
                <Route path="/cliente/projetos/:id" element={<ClienteProjectDetailPage />} />
                <Route path="/cliente/sobre" element={<SobreAClarifyse />} />
                <Route path="/cliente/notificacoes" element={<AdminNotifications />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
