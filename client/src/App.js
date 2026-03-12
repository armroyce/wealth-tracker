import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/layout/Layout';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AccountsPage from './pages/AccountsPage';
import TransactionsPage from './pages/TransactionsPage';
import InvestmentsPage from './pages/InvestmentsPage';
import BudgetPage from './pages/BudgetPage';
import DebtsPage from './pages/DebtsPage';
import GoalsPage from './pages/GoalsPage';
import NetWorthPage from './pages/NetWorthPage';
import ReportsPage from './pages/ReportsPage';
import PhysicalAssetsPage from './pages/PhysicalAssetsPage';
import InsurancePage from './pages/InsurancePage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
    <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
    <Route path="/accounts" element={<ProtectedRoute><AccountsPage /></ProtectedRoute>} />
    <Route path="/transactions" element={<ProtectedRoute><TransactionsPage /></ProtectedRoute>} />
    <Route path="/investments" element={<ProtectedRoute><InvestmentsPage /></ProtectedRoute>} />
    <Route path="/budget" element={<ProtectedRoute><BudgetPage /></ProtectedRoute>} />
    <Route path="/debts" element={<ProtectedRoute><DebtsPage /></ProtectedRoute>} />
    <Route path="/goals" element={<ProtectedRoute><GoalsPage /></ProtectedRoute>} />
    <Route path="/networth" element={<ProtectedRoute><NetWorthPage /></ProtectedRoute>} />
    <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
    <Route path="/physical-assets" element={<ProtectedRoute><PhysicalAssetsPage /></ProtectedRoute>} />
    <Route path="/insurance" element={<ProtectedRoute><InsurancePage /></ProtectedRoute>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'var(--toast-bg, #1f2937)',
              color: '#f9fafb',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.08)',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
