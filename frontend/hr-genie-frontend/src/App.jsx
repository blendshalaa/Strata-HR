import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
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
const EmployeeDirectoryPage = lazy(() => import('./pages/EmployeeDirectoryPage'));
const MyTimesheetsPage = lazy(() => import('./pages/MyTimesheetsPage'));
const OrgSettingsPage = lazy(() => import('./pages/OrgSettingsPage'));
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const ShiftSchedulePage = lazy(() => import('./pages/ShiftSchedulePage'));


const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
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
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
