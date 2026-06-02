import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/AuthContext';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import InventoryPage from './pages/InventoryPage';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import ComplaintsPage from './pages/ComplaintsPage';
import ReportsPage from './pages/ReportsPage';
import AiPredictionsPage from './pages/AiPredictionsPage';
import AdminPanelPage from './pages/AdminPanelPage';
import AccountingPage from './pages/AccountingPage';
import CashPage from './pages/CashPage';
import BankPage from './pages/BankPage';
import WarehousePage from './pages/WarehousePage';
import ProductionPage from './pages/ProductionPage';
import HrPage from './pages/HrPage';
import DocumentsPage from './pages/DocumentsPage';
import TasksPage from './pages/TasksPage';
import NotificationsPage from './pages/NotificationsPage';
import SchedulerPage from './pages/SchedulerPage';
import ConfiguratorPage from './pages/ConfiguratorPage';
import RbacPage from './pages/RbacPage';
import NomenclaturePage from './pages/NomenclaturePage';
import SuppliersPage from './pages/SuppliersPage';
import ReceiptsPage from './pages/ReceiptsPage';
import IssuesPage from './pages/IssuesPage';
import TransfersPage from './pages/TransfersPage';
import ExpiryPage from './pages/ExpiryPage';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <RegisterPage />} />
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="warehouse" element={<WarehousePage />} />
        <Route path="production" element={<ProductionPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="customers/:id" element={<CustomerDetailPage />} />
        <Route path="complaints" element={<ComplaintsPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="accounting" element={<AccountingPage />} />
        <Route path="cash" element={<CashPage />} />
        <Route path="bank" element={<BankPage />} />
        <Route path="hr" element={<HrPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="scheduler" element={<SchedulerPage />} />
        <Route path="configurator" element={<ProtectedRoute roles={['Admin']}><ConfiguratorPage /></ProtectedRoute>} />
        <Route path="rbac" element={<ProtectedRoute roles={['Admin']}><RbacPage /></ProtectedRoute>} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="ai" element={<AiPredictionsPage />} />
        <Route path="admin" element={<ProtectedRoute roles={['Admin']}><AdminPanelPage /></ProtectedRoute>} />
        <Route path="nomenclature" element={<NomenclaturePage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="receipts" element={<ReceiptsPage />} />
        <Route path="issues" element={<IssuesPage />} />
        <Route path="transfers" element={<TransfersPage />} />
        <Route path="expiry" element={<ExpiryPage />} />
      </Route>
    </Routes>
  );
}

import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
