import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Login from "./pages/Login";
import ChangePassword from "./pages/ChangePassword";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import CreateProject from "./pages/CreateProject";
import Researchers from "./pages/Researchers";
import FormBuilder from "./pages/FormBuilder";
import ProjectDetails from "./pages/ProjectDetails";
import ProjectResponses from "./pages/ProjectResponses";
import RespondentForm from "./pages/RespondentForm";
import ThankYou from "./pages/ThankYou";
import DashboardLayout from "./components/layout/DashboardLayout";
import NotFound from "./pages/NotFound";
import { useProjectAutoClose } from "@/hooks/useProjectAutoClose";
import { useDataDeletion } from "@/hooks/useDataDeletion";

const queryClient = new QueryClient();

const AppContent = () => {
  useProjectAutoClose();
  useDataDeletion();

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/trocar-senha" element={<ChangePassword />} />
          <Route path="/r/:slug" element={<RespondentForm />} />
          <Route path="/thank-you/:slug" element={<ThankYou />} />
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projetos" element={<Projects />} />
            <Route path="/projetos/novo" element={<CreateProject />} />
            <Route path="/projetos/:projectId" element={<ProjectDetails />} />
            <Route path="/projetos/:projectId/formulario" element={<FormBuilder />} />
            <Route path="/projetos/:projectId/respostas" element={<ProjectResponses />} />
            <Route path="/pesquisadores" element={<Researchers />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppContent />
  </QueryClientProvider>
);

export default App;
