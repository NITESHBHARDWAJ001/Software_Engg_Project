import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import { UserRole } from './types';
import { ROUTES } from './utils/constants';

// Layouts
import { MarketingLayout, AppLayout, SuperAdminLayout } from './app/layouts';

// Marketing Pages
import LandingPage from './marketing/LandingPage.tsx';

// Auth Pages
import LoginPage from './auth/LoginPage.tsx';
import RegisterPage from './auth/RegisterPage.tsx';

// Super Admin Pages
import SuperAdminDashboard from './superadmin/SuperAdminDashboard.tsx';
import OrganizationsPage from './superadmin/OrganizationsPage.tsx';
import PlansPage from './superadmin/PlansPage.tsx';

// Organization App Pages
import Dashboard from './app/modules/dashboard/Dashboard.tsx';
import TasksPage from './app/modules/tasks/TasksPage.tsx';
import ExhibitionsPage from './app/modules/exhibitions/ExhibitionsPage.tsx';
import CustomersPage from './app/modules/customers/CustomersPage.tsx';
import EmployeesPage from './app/modules/users/EmployeesPage.tsx';
import InventoryPage from './app/modules/inventory/InventoryPage.tsx';
import FinancePage from './app/modules/finance/FinancePage.tsx';
import AnalyticsPage from './app/modules/analytics/AnalyticsPage.tsx';
import SettingsPage from './app/modules/settings/SettingsPage.tsx';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        {/* Marketing Routes */}
        <Route
          path={ROUTES.HOME}
          element={
            <MarketingLayout>
              <LandingPage />
            </MarketingLayout>
          }
        />

        {/* Auth Routes */}
        <Route
          path={ROUTES.LOGIN}
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path={ROUTES.REGISTER}
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />

        {/* Super Admin Routes */}
        <Route
          path={ROUTES.SUPER_ADMIN}
          element={
            <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
              <SuperAdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to={ROUTES.SUPER_ADMIN_DASHBOARD} replace />} />
          <Route path="dashboard" element={<SuperAdminDashboard />} />
          <Route path="organizations" element={<OrganizationsPage />} />
          <Route path="plans" element={<PlansPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
        </Route>

        {/* Organization App Routes */}
        <Route
          path={ROUTES.APP}
          element={
            <ProtectedRoute
              allowedRoles={[UserRole.ORG_ADMIN, UserRole.MANAGER, UserRole.STAFF]}
            >
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="tasks/*" element={<TasksPage />} />
          <Route path="exhibitions/*" element={<ExhibitionsPage />} />
          <Route path="customers/*" element={<CustomersPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="inventory/*" element={<InventoryPage />} />
          <Route path="finance/*" element={<FinancePage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings/*" element={<SettingsPage />} />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
