import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { AppLayout } from '@/components/layout/AppLayout';

// Lazy-load all pages for code splitting
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const ChecklistPage = lazy(() => import('@/pages/ChecklistPage'));
const BudgetPage = lazy(() => import('@/pages/BudgetPage'));
const GuestsPage = lazy(() => import('@/pages/GuestsPage'));
const VendorsPage = lazy(() => import('@/pages/VendorsPage'));
const TimelinePage = lazy(() => import('@/pages/TimelinePage'));
const SeatingPage = lazy(() => import('@/pages/SeatingPage'));
const MoodBoardPage = lazy(() => import('@/pages/MoodBoardPage'));
const NotesPage = lazy(() => import('@/pages/NotesPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const MorePage = lazy(() => import('@/pages/MorePage'));
const ChatPage = lazy(() => import('@/pages/ChatPage'));
const AuthPage = lazy(() => import('@/pages/AuthPage'));
const SetupPage = lazy(() => import('@/pages/SetupPage'));

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isAdmin } = useAuthStore();

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to="/" replace />;

  return <>{children}</>;
}

export default function App() {
  const { initialize, isLoading } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) return <LoadingScreen />;

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public routes */}
        <Route
          path="/auth"
          element={
            <AuthGuard>
              <AuthPage />
            </AuthGuard>
          }
        />

        <Route
          path="/setup"
          element={
            <AdminRoute>
              <Suspense fallback={<LoadingScreen />}>
                <SetupPage />
              </Suspense>
            </AdminRoute>
          }
        />

        {/* Protected routes inside layout */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="checklist" element={<ChecklistPage />} />
          <Route path="budget" element={<BudgetPage />} />
          <Route path="guests" element={<GuestsPage />} />
          <Route path="vendors" element={<VendorsPage />} />
          <Route path="timeline" element={<TimelinePage />} />
          <Route path="seating" element={<SeatingPage />} />
          <Route path="mood-board" element={<MoodBoardPage />} />
          <Route path="notes" element={<NotesPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="more" element={<MorePage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
