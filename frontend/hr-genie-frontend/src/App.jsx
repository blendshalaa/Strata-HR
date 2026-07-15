import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { SocketProvider } from './context/SocketContext';
import Layout from './components/layouts/Layout';
import ErrorBoundary from './components/common/ErrorBoundary';

// Lazy load pages for code splitting
const Login = lazy(() => import('./components/auth/Login'));
const Register = lazy(() => import('./components/auth/Register'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const TimesheetApprovalsPage = lazy(() => import('./pages/TimesheetApprovalsPage'));
const LeavePage = lazy(() => import('./pages/LeavePage'));
const KnowledgePage = lazy(() => import('./pages/KnowledgePage'));
const UserManagementPage = lazy(() => import('./pages/UserManagementPage'));
const LeaveApprovalsPage = lazy(() => import('./pages/LeaveApprovalsPage'));
const DepartmentsPage = lazy(() => import('./pages/DepartmentsPage'));
const RecruitmentPage = lazy(() => import('./pages/RecruitmentPage'));
const PayrollPage = lazy(() => import('./pages/PayrollPage'));
const PerformancePage = lazy(() => import('./pages/PerformancePage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const CareersPage = lazy(() => import('./pages/CareersPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const MyPayslipsPage = lazy(() => import('./pages/MyPayslipsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const EmployeeDirectoryPage = lazy(() => import('./pages/EmployeeDirectoryPage'));
const MyTimesheetsPage = lazy(() => import('./pages/MyTimesheetsPage'));
const OrgSettingsPage = lazy(() => import('./pages/OrgSettingsPage'));
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const ShiftSchedulePage = lazy(() => import('./pages/ShiftSchedulePage'));
const AuditLogPage = lazy(() => import('./pages/AuditLogPage'));
const TrainingPage = lazy(() => import('./pages/TrainingPage'));


const ColdStartLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: '#F7F7F6' }}>
    <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#111318', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    </div>
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: '14px', fontWeight: '500', color: '#111318', marginBottom: '4px' }}>Starting up…</p>
      <p style={{ fontSize: '12px', color: '#9CA3AF', maxWidth: '260px', lineHeight: '1.5' }}>
        The server is waking from a cold state. Usually takes 20–40 seconds.
      </p>
    </div>
    <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
      {[0, 150, 300].map(d => (
        <div key={d} style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#111318', animation: `bounce 1s ${d}ms infinite` }} />
      ))}
    </div>
  </div>
);

const QuickSpinner = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F7F7F6' }}>
    <div style={{ width: '20px', height: '20px', border: '2px solid #E5E7EB', borderTopColor: '#111318', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
  </div>
);

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading, coldStarting } = useAuth();

  if (loading) {
    return coldStarting ? <ColdStartLoader /> : <QuickSpinner />;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, coldStarting } = useAuth();

  if (loading) {
    return coldStarting ? <ColdStartLoader /> : <QuickSpinner />;
  }

  return isAuthenticated ? <Navigate to="/dashboard" /> : children;
};

// A simple loading fallback for lazy-loaded routes
const PageLoader = () => (
  <div className="flex items-center justify-center h-[60vh]">
    <div style={{ width: '18px', height: '18px', border: '1.5px solid #E5E7EB', borderTopColor: '#111318', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
  </div>
);

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <SocketProvider>
        <Router>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <PublicRoute>
                      <Register />
                    </PublicRoute>
                  }
                />

                {/* Public routes */}
                <Route path="/careers" element={<CareersPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                <Route
                  path="/*"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <ErrorBoundary>
                          <Suspense fallback={<PageLoader />}>
                            <Routes>
                              <Route path="/dashboard" element={<DashboardPage />} />
                              <Route path="/chat" element={<ChatPage />} />
                              <Route path="/leave" element={<LeavePage />} />
                              <Route path="/knowledge" element={<KnowledgePage />} />
                              <Route path="/" element={<Navigate to="/dashboard" />} />

                              <Route path="/leave-approvals" element={<LeaveApprovalsPage />} />
                              <Route path="/timesheets" element={<TimesheetApprovalsPage />} />
                              <Route path="/users" element={<UserManagementPage />} />

                              {/* New HR Modules */}
                              <Route path="/departments" element={<DepartmentsPage />} />
                              <Route path="/recruitment" element={<RecruitmentPage />} />
                              <Route path="/payroll" element={<PayrollPage />} />
                              <Route path="/performance" element={<PerformancePage />} />
                              <Route path="/calendar" element={<CalendarPage />} />
                              <Route path="/profile" element={<ProfilePage />} />
                              <Route path="/my-payslips" element={<MyPayslipsPage />} />
                              <Route path="/directory" element={<EmployeeDirectoryPage />} />
                              <Route path="/my-timesheets" element={<MyTimesheetsPage />} />
                              <Route path="/org-settings" element={<OrgSettingsPage />} />
                              <Route path="/documents" element={<DocumentsPage />} />
                              <Route path="/reports" element={<ReportsPage />} />
                              <Route path="/shifts" element={<ShiftSchedulePage />} />
                              <Route path="/audit-log" element={<AuditLogPage />} />
                              <Route path="/training" element={<TrainingPage />} />

                              <Route path="*" element={<NotFoundPage />} />
                            </Routes>
                          </Suspense>
                        </ErrorBoundary>
                      </Layout>
                    </PrivateRoute>
                  }
                />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </Router>
        </SocketProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
