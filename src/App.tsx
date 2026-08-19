import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import { Layout } from './components/Layout';

// Pages
import { SplashScreen } from './pages/SplashScreen';
import { AuthScreen } from './pages/AuthScreen';
import { DashboardScreen } from './pages/DashboardScreen';
import { DeviceConnectionScreen } from './pages/DeviceConnectionScreen';
import { LiveTestScreen } from './pages/LiveTestScreen';
import { ResultsScreen } from './pages/ResultsScreen';
import { ProgressScreen } from './pages/ProgressScreen';
import { AiScreen } from './pages/AiScreen';
import { MedicationScreen } from './pages/MedicationScreen';
import { ReportScreen } from './pages/ReportScreen';
import { ProfileScreen } from './pages/ProfileScreen';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" replace />;
};

export const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* Public Routes */}
          <Route path="/splash" element={<SplashScreen />} />
          <Route path="/auth" element={<AuthScreen />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/connect"
            element={
              <ProtectedRoute>
                <DeviceConnectionScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/test"
            element={
              <ProtectedRoute>
                <LiveTestScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/results"
            element={
              <ProtectedRoute>
                <ResultsScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/progress"
            element={
              <ProtectedRoute>
                <ProgressScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai"
            element={
              <ProtectedRoute>
                <AiScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/medication"
            element={
              <ProtectedRoute>
                <MedicationScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/report"
            element={
              <ProtectedRoute>
                <ReportScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfileScreen />
              </ProtectedRoute>
            }
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/splash" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};
export default App;
