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
  <div className="min-h-screen flex flex-col items-center justify-center gap-5" style={{ backgroundColor: '#F5F4FF' }}>
    <div className="relative">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#5B4FE8' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>
      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white animate-pulse" style={{ backgroundColor: '#F59E0B' }} />
    </div>
    <div className="text-center">
      <h2 className="text-lg font-bold tracking-tight" style={{ color: '#0F0D2E' }}>Waking up the server…</h2>
      <p className="text-sm mt-1.5 max-w-xs" style={{ color: '#71717A' }}>
        The server is starting from a cold state. This usually takes 20–40 seconds on the first visit.
      </p>
    </div>
    <div className="flex items-center gap-1.5 mt-1">
      <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#5B4FE8', animationDelay: '0ms' }} />
      <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#5B4FE8', animationDelay: '150ms' }} />
      <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#5B4FE8', animationDelay: '300ms' }} />
    </div>
  </div>
);

const QuickSpinner = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F4FF' }}>
    <div className="w-8 h-8 border-3 rounded-full animate-spin" style={{ borderColor: '#EEF0FF', borderTopColor: '#5B4FE8' }} />
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
    <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
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
