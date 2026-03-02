import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FiCalendar, FiUsers, FiTrendingUp, FiPackage, FiDollarSign,
  FiBell, FiCheckCircle, FiArrowRight, FiStar, FiZap, FiShield
} from 'react-icons/fi';
import { Button } from '../components/ui';
import { ROUTES } from '../utils/constants';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent-gold/5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-primary-50 text-primary px-4 py-2 rounded-full mb-6 animate-fade-in">
              <FiZap className="text-sm" />
              <span className="text-sm font-medium">Trusted by 500+ Fashion Businesses</span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Transform Your{' '}
              <span className="bg-gradient-to-r from-primary to-accent-gold bg-clip-text text-transparent">
                Ethnic Fashion Business
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Complete business management solution designed exclusively for ethnic fashion businesses. 
              Manage exhibitions, track customers, control inventory, and grow your revenue.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link to={ROUTES.REGISTER}>
                <Button size="lg" rightIcon={<FiArrowRight />}>
                  Start Free Trial
                </Button>
              </Link>
              <Link to={ROUTES.LOGIN}>
                <Button variant="outline" size="lg">
                  Watch Demo
                </Button>
              </Link>
            </div>

            {/* Social Proof */}
            <div className="mt-12 flex items-center justify-center space-x-2 text-sm text-gray-500">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent-gold ring-2 ring-white" />
                ))}
              </div>
              <span>Join 2,000+ happy users</span>
              <div className="flex text-accent-gold">
                {[1, 2, 3, 4, 5].map((i) => (
                  <FiStar key={i} className="fill-current" size={16} />
                ))}
              </div>
              <span className="font-semibold text-gray-900">4.9/5</span>
            </div>
          </div>

          {/* Hero Image/Dashboard Preview */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent h-32 bottom-0" />
            <div className="rounded-2xl overflow-hidden shadow-soft-xl border-8 border-white">
              <div className="bg-gradient-to-br from-primary/10 to-accent-gold/10 p-8 aspect-video flex items-center justify-center">
                <div className="text-center">
                  <FiTrendingUp className="w-24 h-24 text-primary mx-auto mb-4" />
                  <p className="text-lg text-gray-600">Dashboard Preview</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed specifically for ethnic fashion businesses
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            {[
              {
                icon: <FiCalendar className="w-8 h-8" />,
                title: 'Exhibition Intelligence',
                description: 'Plan, track, and analyze exhibition performance with ROI calculations, lead capture, and staff management.',
                color: 'from-purple-500 to-primary',
              },
              {
                icon: <FiUsers className="w-8 h-8" />,
                title: 'Customer & CRM',
                description: 'Convert exhibition leads to customers. Track purchases, preferences, and maintain strong relationships.',
                color: 'from-blue-500 to-primary',
              },
              {
                icon: <FiPackage className="w-8 h-8" />,
                title: 'Smart Inventory',
                description: 'Real-time stock tracking, low-stock alerts, and efficient inventory management for your ethnic wear collection.',
                color: 'from-green-500 to-primary',
              },
              {
                icon: <FiDollarSign className="w-8 h-8" />,
                title: 'Financial Tracking',
                description: 'Track income, expenses, generate invoices, and get complete visibility of your business finances.',
                color: 'from-yellow-500 to-accent-gold',
              },
              {
                icon: <FiTrendingUp className="w-8 h-8" />,
                title: 'Analytics & Reports',
                description: 'Gain actionable insights with detailed analytics, trend analysis, and customizable business reports.',
                color: 'from-pink-500 to-primary',
              },
              {
                icon: <FiBell className="w-8 h-8" />,
                title: 'Task Management',
                description: 'Organize work with kanban boards, calendar views, and team collaboration tools.',
                color: 'from-red-500 to-primary',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-soft-md hover:shadow-soft-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Exhibition Intelligence Highlight */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-accent-gold/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 bg-primary text-white px-3 py-1 rounded-full mb-4 text-sm font-medium">
                <FiStar className="text-accent-gold" />
                <span>Core Feature</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Exhibition Intelligence That Drives Sales
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                The exhibition module is built specifically for ethnic fashion businesses that participate in trade shows, 
                exhibitions, and fashion events. Capture leads on mobile, track ROI, and convert visitors into loyal customers.
              </p>
              <ul className="space-y-4">
                {[
                  'Mobile-optimized lead capture with QR codes',
                  'Real-time exhibition performance tracking',
                  'ROI and conversion rate analytics',
                  'Staff assignment and performance monitoring',
                  'Seamless lead-to-customer conversion',
                ].map((item, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <FiCheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link to={ROUTES.REGISTER}>
                  <Button size="lg">Get Started Free</Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-soft-xl">
                <div className="bg-gradient-to-br from-primary/20 to-accent-gold/20 p-12 aspect-square flex items-center justify-center">
                  <FiCalendar className="w-32 h-32 text-primary" />
                </div>
              </div>
              {/* Floating Stats */}
              <div className="absolute -top-4 -right-4 bg-white rounded-xl p-4 shadow-soft-lg">
                <div className="text-2xl font-bold text-green-600">+245%</div>
                <div className="text-sm text-gray-600">ROI Increase</div>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl p-4 shadow-soft-lg">
                <div className="text-2xl font-bold text-primary">1,234</div>
                <div className="text-sm text-gray-600">Leads Captured</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your business size
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Pricing Cards */}
            {[
              {
                name: 'Starter',
                price: '₹2,999',
                period: '/month',
                description: 'Perfect for small businesses',
                features: [
                  '5 users included',
                  'Up to 10 exhibitions/year',
                  '500 customers',
                  '1,000 inventory items',
                  'Basic analytics',
                  'Email support',
                ],
                popular: false,
              },
              {
                name: 'Professional',
                price: '₹5,999',
                period: '/month',
                description: 'For growing businesses',
                features: [
                  '15 users included',
                  'Unlimited exhibitions',
                  'Unlimited customers',
                  'Unlimited inventory',
                  'Advanced analytics',
                  'Priority support',
                  'Custom branding',
                  'API access',
                ],
                popular: true,
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                period: '',
                description: 'For large organizations',
                features: [
                  'Unlimited users',
                  'Unlimited everything',
                  'White-label solution',
                  'Dedicated account manager',
                  'Custom integrations',
                  '24/7 phone support',
                  'SLA guarantee',
                  'Custom features',
                ],
                popular: false,
              },
            ].map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-2xl p-8 ${
                  plan.popular
                    ? 'border-2 border-primary shadow-soft-xl scale-105'
                    : 'border border-gray-200 shadow-soft-md'
                } hover:shadow-soft-xl transition-all duration-300`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-accent-gold text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 text-sm">{plan.description}</p>
                </div>
                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 ml-2">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start space-x-3">
                      <FiCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to={ROUTES.REGISTER}>
                  <Button
                    fullWidth
                    variant={plan.popular ? 'primary' : 'outline'}
                  >
                    {plan.name === 'Enterprise' ? 'Contact Sales' : 'Start Free Trial'}
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-600 mt-8">
            All plans include 14-day free trial. No credit card required.
          </p>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gradient-to-br from-primary/5 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Loved by Fashion Businesses
            </h2>
            <p className="text-xl text-gray-600">
              See what our customers have to say
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Priya Sharma',
                company: 'Elegant Sarees Pvt Ltd',
                quote: 'The exhibition module has transformed how we manage trade shows. We captured 300+ quality leads in our last event!',
                rating: 5,
              },
              {
                name: 'Rajesh Kumar',
                company: 'Heritage Fashion House',
                quote: 'Finally, a solution built for ethnic fashion businesses. The inventory and customer management features are exceptional.',
                rating: 5,
              },
              {
                name: 'Anita Desai',
                company: 'Royal Ethnic Collection',
                quote: 'ROI tracking and financial analytics helped us increase profitability by 40%. Highly recommended!',
                rating: 5,
              },
            ].map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-soft-md">
                <div className="flex text-accent-gold mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <FiStar key={i} className="fill-current" size={18} />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">&quot;{testimonial.quote}&quot;</p>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent-gold" />
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary-dark">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FiShield className="w-16 h-16 text-accent-gold mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join hundreds of ethnic fashion businesses already growing with our platform
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link to={ROUTES.REGISTER}>
              <Button size="lg" variant="secondary" rightIcon={<FiArrowRight />}>
                Start Your Free Trial
              </Button>
            </Link>
            <Link to={ROUTES.LOGIN}>
              <Button size="lg" variant="outline" className="!text-white !border-white hover:!bg-white/10">
                Schedule a Demo
              </Button>
            </Link>
          </div>
          <p className="text-primary-100 mt-6 text-sm">
            ✓ Free 14-day trial &nbsp;&nbsp; ✓ No credit card required &nbsp;&nbsp; ✓ Cancel anytime
          </p>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
