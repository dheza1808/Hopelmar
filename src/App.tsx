import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute, defaultRoutes } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { WorkflowWorkspace } from './pages/WorkflowWorkspace';

const RoleRedirect: React.FC = () => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 font-mono text-xs text-slate-500">
        Memeriksa sesi pengguna...
      </div>
    );
  }

  if (!user || !role) return <Navigate to="/login" replace />;
  return <Navigate to={defaultRoutes[role]} replace />;
};

const LoginRoute: React.FC = () => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 font-mono text-xs text-slate-500">
        Memeriksa sesi pengguna...
      </div>
    );
  }

  if (user && role) return <Navigate to={defaultRoutes[role]} replace />;
  return <Login />;
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/" element={<RoleRedirect />} />
          <Route element={<ProtectedRoute allowedRoles={['sales_marketing']} />}>
            <Route path="/sales-marketing" element={<WorkflowWorkspace />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['sales_support']} />}>
            <Route path="/sales-support" element={<WorkflowWorkspace />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['exim']} />}>
            <Route path="/exim" element={<WorkflowWorkspace />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['admin_invoice']} />}>
            <Route path="/admin-invoice" element={<WorkflowWorkspace />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['accounting']} />}>
            <Route path="/accounting" element={<WorkflowWorkspace />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
