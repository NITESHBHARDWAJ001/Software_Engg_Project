import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { 
  FiHome, FiCheckSquare, FiCalendar, FiUsers, FiPackage, 
  FiDollarSign, FiTrendingUp, FiSettings, FiMenu, FiX,
  FiBell, FiLogOut, FiChevronDown
} from 'react-icons/fi';
import { useAuthStore, useCurrentOrganization } from '../../store';
import { UserRole } from '../../types';
import { ROUTES } from '../../utils/constants';
import { canAccessModule } from '../../utils/permissions';
import { classNames } from '../../utils/helpers';
import { Badge } from '../../components/ui';
import { authService } from '../../services/api/authService';

interface SidebarItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  module: string;
  badge?: string;
}

const getSidebarItems = (role: UserRole): SidebarItem[] => {
  const allItems: SidebarItem[] = [
    { label: 'Dashboard', icon: <FiHome />, path: ROUTES.DASHBOARD, module: 'dashboard' },
    { label: 'Tasks', icon: <FiCheckSquare />, path: ROUTES.TASKS, module: 'tasks' },
    { label: 'Exhibitions', icon: <FiCalendar />, path: ROUTES.EXHIBITIONS, module: 'exhibitions' },
    { label: 'Customers', icon: <FiUsers />, path: ROUTES.CUSTOMERS, module: 'customers' },
    { label: 'Employees', icon: <FiUsers />, path: ROUTES.EMPLOYEES, module: 'users' },
    { label: 'Inventory', icon: <FiPackage />, path: ROUTES.INVENTORY, module: 'inventory' },
    { label: 'Finance', icon: <FiDollarSign />, path: ROUTES.FINANCE, module: 'finance' },
    { label: 'Analytics', icon: <FiTrendingUp />, path: ROUTES.ANALYTICS, module: 'analytics' },
    { label: 'Settings', icon: <FiSettings />, path: ROUTES.SETTINGS, module: 'settings' },
  ];

  return allItems.filter((item) => canAccessModule(role, item.module as any));
};

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuthStore();
  const organization = useCurrentOrganization();

  const sidebarItems = user ? getSidebarItems(user.role) : [];

  const handleLogout = async () => {
    await authService.logout();
    window.location.href = ROUTES.LOGIN;
  };

  const isActivePath = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={classNames(
          'fixed top-0 left-0 bottom-0 w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <Link to={ROUTES.DASHBOARD} className="flex items-center space-x-2">
            <img src="/logo.jpeg" alt="OperIQ logo" className="w-10 h-10 rounded-lg object-cover" />
            <span className="text-lg font-bold text-gray-900">
              OperIQ
            </span>
          </Link>
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(false)}
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Organization Info */}
        {organization && (
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="text-sm font-medium text-gray-900 truncate">
              {organization.name}
            </div>
            <div className="flex items-center mt-1">
              <Badge variant="success" size="sm">
                {organization.subscriptionPlan}
              </Badge>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={classNames(
                'flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActivePath(item.path)
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-primary-50 hover:text-primary'
              )}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <Badge variant="danger" size="sm">
                  {item.badge}
                </Badge>
              )}
            </Link>
          ))}
        </nav>

        {/* User Section */}
        {user && (
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-3 px-3 py-2">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {user.name}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {user.role.replace('_', ' ')}
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white shadow-sm">
          <div className="h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <button
              className="lg:hidden text-gray-500 hover:text-gray-700"
              onClick={() => setSidebarOpen(true)}
            >
              <FiMenu size={24} />
            </button>

            <div className="flex-1" />

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                <FiBell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg"
                  onClick={() => setUserMenuOpen(!userMenuOpen )}
                >
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold">
                    {user?.name.charAt(0).toUpperCase()}
                  </div>
                  <FiChevronDown size={16} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border border-gray-200">
                    <Link
                      to={ROUTES.SETTINGS_PROFILE}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Profile Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <FiLogOut />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
