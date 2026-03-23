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
const ForceChangePassword = React.lazy(() => import("./pages/ForceChangePassword"));
const AdminDashboard = React.lazy(() => import("./pages/admin/AdminDashboard"));
const ProjetosPage = React.lazy(() => import("./pages/admin/ProjetosPage"));
const ProjectDetailPage = React.lazy(() => import("./pages/admin/ProjectDetailPage"));
const AdminConfiguracoes = React.lazy(() => import("./pages/admin/AdminConfiguracoes"));
const InsightsPage = React.lazy(() => import("./pages/admin/InsightsPage"));
const AdminAnalises = React.lazy(() => import("./pages/admin/AdminAnalises"));

// Client pages
const ClienteDashboard = React.lazy(() => import("./pages/cliente/ClienteDashboard"));
const ClienteProjectDetailPage = React.lazy(() => import("./pages/cliente/ClienteProjectDetailPage"));
const SobreAClarifyse = React.lazy(() => import("./pages/cliente/SobreAClarifyse"));

// Manager pages
const GerenteDashboard = React.lazy(() => import("./pages/gerente/GerenteDashboard"));
const GerenteFinanceiro = React.lazy(() => import("./pages/gerente/GerenteFinanceiro"));

const SurveyPage = React.lazy(() => import("./pages/public/SurveyPage"));
const NotFound = React.lazy(() => import("./pages/NotFound"));

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
    <div className="min-h-screen flex items-center justify-center bg-[#F1EFE8]">
      <Loader2 className="h-8 w-8 animate-spin text-[#2D1E6B]" />
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
              <Route path="/force-change-password" element={<ForceChangePassword />} />

              {/* Protected routes */}
              <Route element={<AppLayout allowedRoles={['admin', 'pesquisador']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/projetos" element={<ProjetosPage />} />
                <Route path="/admin/projetos/:id" element={<ProjectDetailPage />} />
                <Route path="/admin/analises" element={<AdminAnalises />} />
                <Route path="/admin/insights/:id" element={<InsightsPage />} />
                <Route path="/admin/configuracoes" element={<AdminConfiguracoes />} />
              </Route>

              {/* Client routes */}
              <Route element={<AppLayout allowedRoles={['cliente']} />}>
                <Route path="/cliente" element={<ClienteDashboard />} />
                <Route path="/cliente/projetos/:id" element={<ClienteProjectDetailPage />} />
                <Route path="/cliente/sobre" element={<SobreAClarifyse />} />
              </Route>

              {/* Manager routes */}
              <Route element={<AppLayout allowedRoles={['gerente']} />}>
                <Route path="/gerente" element={<GerenteDashboard />} />
                <Route path="/gerente/financeiro" element={<GerenteFinanceiro />} />
              </Route>

              <Route path="/survey/:id" element={<SurveyPage />} />
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
