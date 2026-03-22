import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider } from '@/context/NotificationContext';
import { AppLayout } from '@/components/AppLayout';
import { ToastContainer } from '@/components/ToastContainer';

const LoginPage = lazy(() => import('@/pages/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('@/pages/ProjectDetailPage'));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const SurveyPage = lazy(() => import('@/pages/SurveyPage'));
const InsightsPage = lazy(() => import('@/pages/InsightsPage'));

function isAuthenticated(): boolean {
  try {
    return !!localStorage.getItem('surveyForge_user');
  } catch {
    return false;
  }
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AuthedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

const PageLoader = () => (
  <div className="flex items-center justify-center h-screen bg-[#F1EFE8]">
    <div className="w-8 h-8 border-2 border-[#2D1E6B]/20 border-t-[#2D1E6B] rounded-full animate-spin" />
  </div>
);

function App() {
  return (
    <NotificationProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/survey/:id" element={<SurveyPage />} />
          <Route
            path="/insights/:id"
            element={
              <ProtectedRoute>
                <InsightsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/dashboard" element={<AuthedLayout><DashboardPage /></AuthedLayout>} />
          <Route path="/projects" element={<AuthedLayout><ProjectsPage /></AuthedLayout>} />
          <Route path="/projects/:id" element={<AuthedLayout><ProjectDetailPage /></AuthedLayout>} />
          <Route path="/analytics" element={<AuthedLayout><AnalyticsPage /></AuthedLayout>} />
          <Route path="/settings" element={<AuthedLayout><SettingsPage /></AuthedLayout>} />
          <Route path="/" element={<Navigate to={isAuthenticated() ? '/dashboard' : '/login'} replace />} />
          <Route path="*" element={<Navigate to={isAuthenticated() ? '/dashboard' : '/login'} replace />} />
        </Routes>
      </Suspense>
      <ToastContainer />
    </NotificationProvider>
  );
}

export default App;
