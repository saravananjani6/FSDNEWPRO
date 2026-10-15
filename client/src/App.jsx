import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NetworkProvider } from './context/NetworkContext';
import { LanguageProvider } from './context/LanguageContext';
import { SyncProvider } from './context/SyncContext';
import { seedLocalDataIfEmpty } from './database/db';

import { Navbar } from './components/common/Navbar';
import { NetworkStatusBanner } from './components/common/NetworkStatusBanner';

import { LoginPage } from './pages/LoginPage';
import { StaffLoginPage } from './pages/StaffLoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PatientListPage } from './pages/PatientListPage';
import { PatientRegisterPage } from './pages/PatientRegisterPage';
import { PatientDetailPage } from './pages/PatientDetailPage';
import { TriageAssessmentPage } from './pages/TriageAssessmentPage';
import { TriageQueuePage } from './pages/TriageQueuePage';
import { PatientRecordsPage } from './pages/PatientRecordsPage';
import { SyncDashboardPage } from './pages/SyncDashboardPage';
import { ConflictResolutionPage } from './pages/ConflictResolutionPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { PrivacyDisclaimerPage } from './pages/PrivacyDisclaimerPage';
import { SeniorSelfTriagePage } from './pages/SeniorSelfTriagePage';
import { NearbyClinicsMapPage } from './pages/NearbyClinicsMapPage';

function ProtectedRoute({ children, allowedRoles = ['admin'] }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function MainLayout({ children }) {
  return (
    <div className="app-container">
      <Navbar />
      <NetworkStatusBanner />
      <main className="main-content">{children}</main>
    </div>
  );
}

export function App() {
  useEffect(() => {
    // Seed offline IndexedDB records on first launch
    seedLocalDataIfEmpty();
  }, []);

  return (
    <LanguageProvider>
      <NetworkProvider>
        <AuthProvider>
          <SyncProvider>
            <Router>
              <Routes>
                {/* Admin Portal Login (Dedicated Admin Panel Only) */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/admin-login" element={<LoginPage />} />

                {/* Clinical Staff & Doctor Login (Alone Dedicated Page) */}
                <Route path="/staff-login" element={<StaffLoginPage />} />
                <Route path="/worker-login" element={<StaffLoginPage />} />
                <Route path="/doctor-login" element={<StaffLoginPage />} />

                {/* Senior Citizen Zero-Literacy Voice & Visual Self-Triage Mode */}
                <Route path="/senior-triage" element={<SeniorSelfTriagePage />} />

                {/* Core Patient App Routes (Accessible by Patient without credentials) */}
                <Route
                  path="/"
                  element={
                    <MainLayout>
                      <DashboardPage />
                    </MainLayout>
                  }
                />

                <Route
                  path="/triage"
                  element={
                    <MainLayout>
                      <TriageAssessmentPage />
                    </MainLayout>
                  }
                />

                <Route
                  path="/my-records"
                  element={
                    <MainLayout>
                      <PatientRecordsPage />
                    </MainLayout>
                  }
                />

                <Route
                  path="/register"
                  element={
                    <MainLayout>
                      <PatientRegisterPage />
                    </MainLayout>
                  }
                />

                <Route
                  path="/sync"
                  element={
                    <MainLayout>
                      <SyncDashboardPage />
                    </MainLayout>
                  }
                />

                {/* Nearest Clinics & Hospitals GPS Map */}
                <Route
                  path="/clinics"
                  element={
                    <MainLayout>
                      <NearbyClinicsMapPage />
                    </MainLayout>
                  }
                />

                {/* Clinical & Staff Management Routes (Admin, Health Worker, Doctor) */}
                <Route
                  path="/queue"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'health_worker', 'doctor']}>
                      <MainLayout>
                        <TriageQueuePage />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/patients"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'health_worker', 'doctor']}>
                      <MainLayout>
                        <PatientListPage />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/patients/:id"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'health_worker', 'doctor']}>
                      <MainLayout>
                        <PatientDetailPage />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/conflicts"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <MainLayout>
                        <ConflictResolutionPage />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/audit"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <MainLayout>
                        <AuditLogsPage />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/privacy"
                  element={
                    <MainLayout>
                      <PrivacyDisclaimerPage />
                    </MainLayout>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Router>
          </SyncProvider>
        </AuthProvider>
      </NetworkProvider>
    </LanguageProvider>
  );
}

export default App;
