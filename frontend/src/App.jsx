import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Layout from './components/layout/Layout';

// Pages
import Login from './pages/auth/Login';
import StudentOverview from './pages/student/StudentOverview';
import MiniProject from './pages/student/MiniProject';
import StudentTasks from './pages/student/StudentTasks';
import StudentGradebook from './pages/student/StudentGradebook';
import StudentTeam from './pages/student/StudentTeam';

import FacultyOverview from './pages/faculty/FacultyOverview';
import FacultySubmissions from './pages/faculty/FacultySubmissions';

import HodOverview from './pages/hod/HodOverview';
import HodProjects from './pages/hod/HodProjects';
import HodDeliverablesConfig from './pages/hod/HodDeliverablesConfig';
import HodAuditHistory from './pages/hod/HodAuditHistory';
import HodUserManagement from './pages/hod/HodUserManagement';

import Inbox from './pages/common/Inbox';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F5F7FB]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their authorized home
    const redirectMap = {
      HOD: '/hod',
      FACULTY: '/faculty',
      STUDENT: '/student',
    };
    return <Navigate to={redirectMap[user.role] || '/login'} replace />;
  }

  return children;
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  const redirectMap = {
    HOD: '/hod',
    FACULTY: '/faculty',
    STUDENT: '/student',
  };
  return <Navigate to={redirectMap[user.role] || '/login'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Student Protected Routes */}
            <Route
              path="/student"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<StudentOverview />} />
              <Route path="mini-project" element={<MiniProject />} />
              <Route path="weekly-deliverables" element={<MiniProject />} />
              <Route path="tasks" element={<StudentTasks />} />
              <Route path="gradebook" element={<StudentGradebook />} />
              <Route path="team" element={<StudentTeam />} />
            </Route>

            {/* Faculty Protected Routes */}
            <Route
              path="/faculty"
              element={
                <ProtectedRoute allowedRoles={['FACULTY']}>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<FacultyOverview />} />
              <Route path="projects" element={<FacultyOverview />} />
              <Route path="teams" element={<StudentTeam />} />
              <Route path="submissions" element={<FacultySubmissions />} />
              <Route path="gradebook" element={<StudentGradebook />} />
            </Route>

            {/* HOD Protected Routes */}
            <Route
              path="/hod"
              element={
                <ProtectedRoute allowedRoles={['HOD']}>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<HodOverview />} />
              <Route path="projects" element={<HodProjects />} />
              <Route path="approvals" element={<HodProjects />} />
              <Route path="deliverables-config" element={<HodDeliverablesConfig />} />
              <Route path="gradebook" element={<StudentGradebook />} />
              <Route path="reports" element={<HodOverview />} />
              <Route path="audit" element={<HodAuditHistory />} />
              <Route path="users" element={<HodUserManagement />} />
            </Route>

            {/* Shared Inbox Route accessible to all roles */}
            <Route
              path="/inbox"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Inbox />} />
            </Route>

            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}
