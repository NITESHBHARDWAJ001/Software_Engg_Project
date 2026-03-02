import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FiMail, FiLock, FiUser, FiBriefcase, FiArrowRight, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'sonner';
import { Button, Input, Card } from '../components/ui';
import { useAuthStore } from '../store';
import { useOrganizationStore } from '../store/organizationStore';
import { authService, mockOrganizations } from '../services/mock/authService';
import { ROUTES } from '../utils/constants';

const registerSchema = z.object({
  organizationName: z.string().min(2, 'Organization name is required'),
  adminName: z.string().min(2, 'Your name is required'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  planId: z.string().min(1, 'Please select a plan'),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: '₹2,999',
    period: '/month',
    features: [
      '5 users included',
      'Up to 10 exhibitions/year',
      '500 customers',
      '1,000 inventory items',
      'Basic analytics',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '₹5,999',
    period: '/month',
    popular: true,
    features: [
      '15 users included',
      'Unlimited exhibitions',
      'Unlimited customers',
      'Unlimited inventory',
      'Advanced analytics',
      'Priority support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    features: [
      'Unlimited users',
      'Unlimited everything',
      'White-label solution',
      'Dedicated support',
      'Custom features',
    ],
  },
];

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login: setAuth } = useAuthStore();
  const { setCurrentOrganization } = useOrganizationStore();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('professional');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      planId: 'professional',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const response = await authService.register({
        organizationName: data.organizationName,
        adminName: data.adminName,
        email: data.email,
        password: data.password,
        planId: data.planId,
      });

      // Set auth
      setAuth(response.user, response.token);

      // Set organization
      if (response.user.organizationId) {
        const org = mockOrganizations.find(
          (o) => o.id === response.user.organizationId
        );
        if (org) {
          setCurrentOrganization(org);
        }
      }

      toast.success(`Welcome to EthnicFashion, ${response.user.name}! Your 14-day trial has started.`);
      navigate(ROUTES.DASHBOARD);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlanId(planId);
    setValue('planId', planId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent-gold/5 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Logo and Header */}
        <div className="text-center mb-10">
          <Link to={ROUTES.HOME} className="inline-flex items-center space-x-2 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">E</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              EthnicFashion
            </span>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Start Your Free Trial
          </h2>
          <p className="text-gray-600">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side - Form */}
          <div className="lg:col-span-2">
            <Card>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Step 1: Organization Details */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    1. Organization Details
                  </h3>
                  <div className="space-y-4">
                    <Input
                      {...register('organizationName')}
                      label="Organization Name"
                      placeholder="e.g., Elegant Sarees Pvt Ltd"
                      leftIcon={<FiBriefcase />}
                      error={errors.organizationName?.message}
                      fullWidth
                      required
                    />
                  </div>
                </div>

                {/* Step 2: Admin Details */}
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    2. Admin Account
                  </h3>
                  <div className="space-y-4">
                    <Input
                      {...register('adminName')}
                      label="Your Full Name"
                      placeholder="e.g., John Doe"
                      leftIcon={<FiUser />}
                      error={errors.adminName?.message}
                      fullWidth
                      required
                    />

                    <Input
                      {...register('email')}
                      type="email"
                      label="Email Address"
                      placeholder="you@company.com"
                      leftIcon={<FiMail />}
                      error={errors.email?.message}
                      fullWidth
                      required
                    />

                    <Input
                      {...register('password')}
                      type="password"
                      label="Password"
                      placeholder="Create a strong password"
                      leftIcon={<FiLock />}
                      error={errors.password?.message}
                      helperText="At least 8 characters with uppercase and number"
                      fullWidth
                      required
                    />

                    <Input
                      {...register('confirmPassword')}
                      type="password"
                      label="Confirm Password"
                      placeholder="Re-enter your password"
                      leftIcon={<FiLock />}
                      error={errors.confirmPassword?.message}
                      fullWidth
                      required
                    />
                  </div>
                </div>

                {/* Step 3: Terms */}
                <div className="pt-6 border-t border-gray-200">
                  <label className="flex items-start space-x-3">
                    <input
                      {...register('acceptTerms')}
                      type="checkbox"
                      className="mt-1 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">
                      I agree to the{' '}
                      <a href="#" className="text-primary hover:text-primary-dark font-medium">
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a href="#" className="text-primary hover:text-primary-dark font-medium">
                        Privacy Policy
                      </a>
                    </span>
                  </label>
                  {errors.acceptTerms && (
                    <p className="text-sm text-red-600 mt-1">{errors.acceptTerms.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  isLoading={isLoading}
                  rightIcon={<FiArrowRight />}
                >
                  Start Free Trial
                </Button>

                <p className="text-center text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link
                    to={ROUTES.LOGIN}
                    className="text-primary hover:text-primary-dark font-medium"
                  >
                    Sign in
                  </Link>
                </p>
              </form>
            </Card>
          </div>

          {/* Right Side - Plan Selection */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                3. Choose Your Plan
              </h3>
              <div className="space-y-3">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => handlePlanSelect(plan.id)}
                    className={`w-full text-left rounded-xl p-4 border-2 transition-all ${
                      selectedPlanId === plan.id
                        ? 'border-primary bg-primary-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                        {plan.popular && (
                          <span className="inline-block mt-1 text-xs bg-accent-gold text-gray-900 px-2 py-0.5 rounded-full font-medium">
                            Popular
                          </span>
                        )}
                      </div>
                      {selectedPlanId === plan.id && (
                        <FiCheckCircle className="text-primary w-6 h-6" />
                      )}
                    </div>
                    <div className="mb-3">
                      <span className="text-2xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-600 text-sm">{plan.period}</span>
                    </div>
                    <ul className="space-y-1">
                      {plan.features.slice(0, 3).map((feature, idx) => (
                        <li key={idx} className="text-xs text-gray-600 flex items-center">
                          <FiCheckCircle className="w-3 h-3 text-green-500 mr-1.5 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>

              <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-start space-x-2">
                  <FiCheckCircle className="text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-900">
                    <p className="font-medium">14-Day Free Trial</p>
                    <p className="text-green-700 mt-1">
                      No credit card required. Full access to all features.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
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

export default RegisterPage;
