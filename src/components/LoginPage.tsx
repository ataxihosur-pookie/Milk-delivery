import React, { useState } from 'react';
import { Milk, Eye, EyeOff, Users, Truck, ShoppingCart } from 'lucide-react';
import { User } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import SupplierSignup from './SupplierSignup';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const { deliveryPartners } = useData();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'supplier' | 'delivery_partner' | 'customer'>('supplier');
  const [showSignup, setShowSignup] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (userRole === 'delivery_partner') {
      // For delivery partners, check against registered delivery partners
      const partner = deliveryPartners.find(dp => 
        dp.email === email && dp.password === password
      );
      
      if (partner) {
        const user: User = {
          id: partner.id,
          name: partner.name,
          email: partner.email,
          role: 'delivery_partner',
          supplierId: partner.supplierId
        };
        onLogin(user);
      } else {
        setError('Invalid credentials. Please check your email and password.');
      }
    } else {
      // Demo login credentials for other roles
      const demoCredentials = {
        admin: { email: 'admin@milkchain.com', password: 'admin123', name: 'Admin User' },
        supplier: { email: 'admin@puredairy.com', password: 'supplier123', name: 'Pure Dairy Farm', id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
        customer: { email: 'john@example.com', password: 'customer123', name: 'John Smith' }
      };

      const credentials = demoCredentials[userRole as keyof typeof demoCredentials];
      
      if (credentials && email === credentials.email && password === credentials.password) {
        const user: User = {
          id: userRole === 'supplier' ? (credentials.id || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11') : `${userRole}-1`,
          name: credentials.name,
          email: credentials.email,
          role: userRole,
          supplierId: userRole === 'customer' ? 'supplier-1' : undefined
        };
        onLogin(user);
      } else {
        setError('Invalid email or password');
      }
    }
  };

  if (showSignup) {
    return <SupplierSignup onBack={() => setShowSignup(false)} onSignupSuccess={() => setShowSignup(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
            <Milk className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">MilkChain</h2>
          <p className="mt-2 text-sm text-gray-600">Digital Milk Supply Chain Management</p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setUserRole('admin')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center space-x-1 transition-colors ${
                userRole === 'admin' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Admin</span>
            </button>
            <button
              type="button"
              onClick={() => setUserRole('supplier')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center space-x-1 transition-colors ${
                userRole === 'supplier' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Milk className="h-4 w-4" />
              <span>Supplier</span>
            </button>
            <button
              type="button"
              onClick={() => setUserRole('delivery_partner')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center space-x-1 transition-colors ${
                userRole === 'delivery_partner' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Truck className="h-4 w-4" />
              <span>Delivery</span>
            </button>
            <button
              type="button"
              onClick={() => setUserRole('customer')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center space-x-1 transition-colors ${
                userRole === 'customer' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Customer</span>
            </button>
          </div>

          <form className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-lg" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  {userRole === 'delivery_partner' ? 'Email Address' : 'Email address'}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder={userRole === 'delivery_partner' ? 'Enter your email address' : 'Enter your email'}
                />
              </div>
              <div className="relative">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center top-6"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Sign in as {userRole.replace('_', ' ')}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowSignup(true)}
                className="text-sm text-blue-600 hover:text-blue-500 font-medium"
              >
                New supplier? Sign up here
              </button>
            </div>

            <div className="mt-6 text-xs text-gray-500 space-y-2">
              <div className="font-semibold">Demo Credentials:</div>
              <div>Admin: admin@milkchain.com / admin123</div>
              <div>Supplier: admin@puredairy.com / supplier123</div>
              <div>Delivery: Use email & password created by supplier</div>
              <div>Customer: john@example.com / customer123</div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;