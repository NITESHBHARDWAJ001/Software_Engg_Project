import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FiMail, FiLock, FiArrowRight, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'sonner';
import { Button, Input } from '../components/ui';
import { useAuthStore } from '../store';
import { useOrganizationStore } from '../store/organizationStore';
import { authService, mockOrganizations } from '../services/mock/authService';
import { ROUTES } from '../utils/constants';
import { UserRole } from '../types';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login: setAuth } = useAuthStore();
  const { setCurrentOrganization } = useOrganizationStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await authService.login({
        email: data.email,
        password: data.password,
      });

      // Set auth
      setAuth(response.user, response.token);

      // Set organization if user has one
      if (response.user.organizationId) {
        const org = mockOrganizations.find(
          (o) => o.id === response.user.organizationId
        );
        if (org) {
          setCurrentOrganization(org);
        }
      }

      toast.success(`Welcome back, ${response.user.name}!`);

      // Navigate based on role
      if (response.user.role === UserRole.SUPER_ADMIN) {
        navigate(ROUTES.SUPER_ADMIN_DASHBOARD);
      } else {
        navigate(ROUTES.DASHBOARD);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (email: string) => {
    setValue('email', email);
    setValue('password', 'demo123');
  };

  const demoAccounts = authService.getDemoUsers();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent-gold/5 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <Link to={ROUTES.HOME} className="inline-flex items-center space-x-2 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">E</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              EthnicFashion
            </span>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h2>
          <p className="text-gray-600">
            Sign in to access your dashboard
          </p>
        </div>

        {/* Demo Accounts */}
        {showDemoAccounts && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <FiAlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  Demo Accounts Available
                </h3>
                <div className="space-y-1.5">
                  {demoAccounts.map((account) => (
                    <button
                      key={account.email}
                      onClick={() => handleDemoLogin(account.email)}
                      className="block w-full text-left text-xs bg-white hover:bg-blue-50 rounded px-2 py-1.5 transition-colors"
                    >
                      <span className="font-medium text-gray-900">
                        {account.role.replace('_', ' ')}
                      </span>
                      <br />
                      <span className="text-gray-600">{account.email}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Password for all: <code className="bg-white px-1 py-0.5 rounded">demo123</code>
                </p>
              </div>
              <button
                onClick={() => setShowDemoAccounts(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Login Form */}
        <div className="bg-white shadow-soft-xl rounded-2xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              {...register('email')}
              type="email"
              label="Email Address"
              placeholder="you@example.com"
              leftIcon={<FiMail />}
              error={errors.email?.message}
              fullWidth
              required
            />

            <Input
              {...register('password')}
              type="password"
              label="Password"
              placeholder="Enter your password"
              leftIcon={<FiLock />}
              error={errors.password?.message}
              fullWidth
              required
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <Link
                to={ROUTES.FORGOT_PASSWORD}
                className="text-sm text-primary hover:text-primary-dark font-medium"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isLoading}
              rightIcon={<FiArrowRight />}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to={ROUTES.REGISTER}
                className="text-primary hover:text-primary-dark font-medium"
              >
                Start free trial
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <Link
            to={ROUTES.HOME}
            className="text-sm text-gray-600 hover:text-primary"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
