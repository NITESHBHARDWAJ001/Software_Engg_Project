import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  FiHome, FiUsers, FiPackage, FiTrendingUp, FiMenu, FiX, 
  FiLogOut, FiChevronDown
} from 'react-icons/fi';
import { useAuthStore } from '../../store';
import { ROUTES } from '../../utils/constants';
import { classNames } from '../../utils/helpers';

interface SidebarItem {
  label: string;
  icon: React.ReactNode;
  path: string;
}

const sidebarItems: SidebarItem[] = [
  { label: 'Dashboard', icon: <FiHome />, path: ROUTES.SUPER_ADMIN_DASHBOARD },
  { label: 'Organizations', icon: <FiUsers />, path: ROUTES.SUPER_ADMIN_ORGANIZATIONS },
  { label: 'Plans', icon: <FiPackage />, path: ROUTES.SUPER_ADMIN_PLANS },
  { label: 'Analytics', icon: <FiTrendingUp />, path: ROUTES.SUPER_ADMIN_ANALYTICS },
];

export const SuperAdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
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
          'fixed top-0 left-0 bottom-0 w-64 bg-gradient-to-b from-primary-dark to-primary shadow-lg z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-primary-light/20">
          <Link to={ROUTES.SUPER_ADMIN_DASHBOARD} className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-primary font-bold text-xl">E</span>
            </div>
            <div>
              <span className="text-lg font-bold text-white block leading-none">
                EthnicFashion
              </span>
              <span className="text-xs text-primary-100">Super Admin</span>
            </div>
          </Link>
          <button
            className="lg:hidden text-white hover:text-primary-100"
            onClick={() => setSidebarOpen(false)}
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {sidebarItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={classNames(
                'flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActivePath(item.path)
                  ? 'bg-white text-primary'
                  : 'text-white hover:bg-primary-light/20'
              )}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* User Section */}
        {user && (
          <div className="border-t border-primary-light/20 p-4">
            <div className="flex items-center space-x-3 px-3 py-2">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {user.name}
                </div>
                <div className="text-xs text-primary-100 truncate">
                  Super Admin
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
              {/* User Menu */}
              <div className="relative">
                <button
                  className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold">
                    {user?.name.charAt(0).toUpperCase()}
                  </div>
                  <FiChevronDown size={16} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border border-gray-200">
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
