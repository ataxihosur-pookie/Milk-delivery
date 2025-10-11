import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Package, ShoppingBag, Newspaper, Bell, User, Home, Droplet, Calendar, TrendingUp, Award, Clock, MapPin } from 'lucide-react';
import { User as UserType } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import type { MonthlyInvoice } from '../lib/customerService';

interface CustomerPortalProps {
  user: UserType;
  onLogout: () => void;
}

const CustomerPortal: React.FC<CustomerPortalProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/customer/login');
  };

  const { deliveries, deliveryPartners, customers, getCustomerInvoices } = useData();
  const [activeSection, setActiveSection] = useState('home');
  const [invoices, setInvoices] = useState<MonthlyInvoice[]>([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const customerPhone = user.phone || user.email;
  const customer = customers.find(c => c.phone === customerPhone || c.email === user.email);
  const myDeliveries = deliveries.filter(d => d.customerId === (customer?.id || user.id));

  useEffect(() => {
    if (customerPhone) {
      loadInvoices();
    }
  }, [customerPhone]);

  const loadInvoices = async () => {
    try {
      setIsLoading(true);
      const data = await getCustomerInvoices(customerPhone);
      setInvoices(data);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const todayDeliveries = myDeliveries.filter(d => d.date === new Date().toISOString().split('T')[0]);
  const completedDeliveries = myDeliveries.filter(d => d.status === 'completed');
  const currentMonthDeliveries = myDeliveries.filter(d => {
    const deliveryDate = new Date(d.date);
    const now = new Date();
    return deliveryDate.getMonth() === now.getMonth() && deliveryDate.getFullYear() === now.getFullYear() && d.status === 'completed';
  });

  const currentMonthTotal = currentMonthDeliveries.reduce((sum, d) => sum + d.quantity, 0);
  const totalDelivered = completedDeliveries.reduce((sum, d) => sum + d.quantity, 0);

  const recentDeliveries = myDeliveries
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const products = [
    {
      id: 1,
      name: 'Fresh Cow Milk',
      description: 'Pure and fresh cow milk delivered daily',
      image: 'https://images.pexels.com/photos/236010/pexels-photo-236010.jpeg?auto=compress&cs=tinysrgb&w=400',
      price: customer?.dailyQuantity || 1,
      unit: 'Liters/day'
    },
    {
      id: 2,
      name: 'Buffalo Milk',
      description: 'Rich and creamy buffalo milk',
      image: 'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&cs=tinysrgb&w=400',
      price: 0,
      unit: 'Liters/day'
    },
    {
      id: 3,
      name: 'Organic Milk',
      description: 'Certified organic milk from grass-fed cows',
      image: 'https://images.pexels.com/photos/1549196/pexels-photo-1549196.jpeg?auto=compress&cs=tinysrgb&w=400',
      price: 0,
      unit: 'Liters/day'
    }
  ];

  const newsUpdates = [
    {
      id: 1,
      title: 'Quality Assurance Update',
      description: 'All our milk undergoes rigorous quality testing daily',
      date: '2 hours ago',
      icon: Award
    },
    {
      id: 2,
      title: 'New Delivery Schedule',
      description: 'Morning deliveries now start at 6:00 AM',
      date: '1 day ago',
      icon: Clock
    },
    {
      id: 3,
      title: 'Health Benefits',
      description: 'Fresh milk is rich in calcium and essential nutrients',
      date: '2 days ago',
      icon: TrendingUp
    }
  ];

  const renderHome = () => (
    <div className="space-y-6 animate-fadeIn">
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-blue-600 via-blue-500 to-green-500 rounded-2xl overflow-hidden shadow-lg transform hover:scale-[1.02] transition-transform duration-300">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="relative h-full flex flex-col justify-center px-6 md:px-8 text-white">
          <h1 className="text-2xl md:text-4xl font-bold mb-2 animate-slideInLeft">Welcome, {user.name}!</h1>
          <p className="text-sm md:text-lg opacity-90 animate-slideInLeft" style={{animationDelay: '0.1s'}}>Fresh milk delivered to your doorstep daily</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 md:p-6 text-white shadow-lg transform hover:scale-105 transition-all duration-300 animate-fadeInUp">
          <Package className="h-8 w-8 md:h-10 md:w-10 mb-2 opacity-80" />
          <p className="text-2xl md:text-3xl font-bold">{currentMonthDeliveries.length}</p>
          <p className="text-xs md:text-sm opacity-80">This Month</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 md:p-6 text-white shadow-lg transform hover:scale-105 transition-all duration-300 animate-fadeInUp" style={{animationDelay: '0.1s'}}>
          <Droplet className="h-8 w-8 md:h-10 md:w-10 mb-2 opacity-80" />
          <p className="text-2xl md:text-3xl font-bold">{currentMonthTotal.toFixed(0)}L</p>
          <p className="text-xs md:text-sm opacity-80">Total Quantity</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 md:p-6 text-white shadow-lg transform hover:scale-105 transition-all duration-300 animate-fadeInUp" style={{animationDelay: '0.2s'}}>
          <Award className="h-8 w-8 md:h-10 md:w-10 mb-2 opacity-80" />
          <p className="text-2xl md:text-3xl font-bold">{completedDeliveries.length}</p>
          <p className="text-xs md:text-sm opacity-80">Total Orders</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 md:p-6 text-white shadow-lg transform hover:scale-105 transition-all duration-300 animate-fadeInUp" style={{animationDelay: '0.3s'}}>
          <TrendingUp className="h-8 w-8 md:h-10 md:w-10 mb-2 opacity-80" />
          <p className="text-2xl md:text-3xl font-bold">{totalDelivered.toFixed(0)}L</p>
          <p className="text-xs md:text-sm opacity-80">All Time</p>
        </div>
      </div>

      {todayDeliveries.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 animate-slideInUp">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Bell className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Today's Delivery</h3>
              <p className="text-sm text-gray-500">Your milk is on the way!</p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Quantity</p>
                <p className="text-xl font-bold text-gray-900">{todayDeliveries[0].quantity}L</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Status</p>
                <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                  {todayDeliveries[0].status === 'pending' ? 'On the way' : todayDeliveries[0].status}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 animate-slideInUp" style={{animationDelay: '0.2s'}}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Updates</h3>
        <div className="space-y-3">
          {newsUpdates.slice(0, 2).map((news, index) => (
            <div key={news.id} className="flex items-start space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors duration-200" style={{animationDelay: `${0.3 + index * 0.1}s`}}>
              <div className="p-2 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg">
                <news.icon className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{news.title}</p>
                <p className="text-xs text-gray-500 mt-1">{news.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Our Products</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product, index) => (
          <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 transform hover:scale-105 hover:shadow-2xl transition-all duration-300 animate-fadeInUp" style={{animationDelay: `${index * 0.1}s`}}>
            <div className="relative h-48 overflow-hidden">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-500" />
              {product.price > 0 && (
                <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  Active
                </div>
              )}
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{product.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{product.description}</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{product.price}</p>
                  <p className="text-xs text-gray-500">{product.unit}</p>
                </div>
                {product.price === 0 && (
                  <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105">
                    Contact Us
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMilkCard = () => (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-6 md:p-8 text-white shadow-xl transform hover:scale-[1.02] transition-transform duration-300">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Milk Subscription Card</h2>
            <p className="text-sm opacity-90">Your daily delivery details</p>
          </div>
          <Droplet className="h-16 w-16 opacity-50" />
        </div>
        <div className="grid grid-cols-2 gap-4 bg-white bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
          <div>
            <p className="text-xs opacity-80 mb-1">Daily Quantity</p>
            <p className="text-3xl font-bold">{customer?.dailyQuantity || 0}L</p>
          </div>
          <div>
            <p className="text-xs opacity-80 mb-1">Customer ID</p>
            <p className="text-lg font-mono">{customer?.id.slice(0, 8)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Delivery History</h3>
          <Calendar className="h-5 w-5 text-gray-400" />
        </div>
        <div className="space-y-4">
          {recentDeliveries.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No deliveries yet</p>
            </div>
          ) : (
            recentDeliveries.map((delivery, index) => (
              <div key={delivery.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-all duration-200 border border-gray-100 animate-slideInRight" style={{animationDelay: `${index * 0.1}s`}}>
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-xl ${delivery.status === 'completed' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                    <Package className={`h-5 w-5 ${delivery.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{new Date(delivery.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    <p className="text-sm text-gray-500">{delivery.quantity}L delivered</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  delivery.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {delivery.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderNews = () => (
    <div className="space-y-6 animate-fadeIn">
      <h2 className="text-2xl font-bold text-gray-900">News & Updates</h2>
      <div className="space-y-4">
        {newsUpdates.map((news, index) => (
          <div key={news.id} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-fadeInUp" style={{animationDelay: `${index * 0.1}s`}}>
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-green-100 rounded-xl">
                <news.icon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{news.title}</h3>
                <p className="text-gray-600 mb-3">{news.description}</p>
                <p className="text-xs text-gray-400">{news.date}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 md:p-8 text-white shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center">
            <User className="h-10 w-10 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{customer?.name || user.name}</h2>
            <p className="text-sm opacity-90">{customerPhone}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Delivery Address</p>
                <p className="text-sm text-gray-600">{customer?.address}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center space-x-3">
              <Droplet className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Daily Subscription</p>
                <p className="text-sm text-gray-600">{customer?.dailyQuantity || 0} Liters/day</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center space-x-3">
              <Package className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Total Deliveries</p>
                <p className="text-sm text-gray-600">{completedDeliveries.length} orders completed</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="w-full py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors duration-300 flex items-center justify-center space-x-2"
      >
        <LogOut className="h-5 w-5" />
        <span>Logout</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-xl flex items-center justify-center">
                <Droplet className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">MilkChain</span>
            </div>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300"
            >
              <User className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24">
        {activeSection === 'home' && renderHome()}
        {activeSection === 'products' && renderProducts()}
        {activeSection === 'milk-card' && renderMilkCard()}
        {activeSection === 'news' && renderNews()}
        {activeSection === 'profile' && renderProfile()}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-around py-3">
            <button
              onClick={() => setActiveSection('home')}
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-xl transition-all duration-300 ${
                activeSection === 'home' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Home className="h-6 w-6" />
              <span className="text-xs font-medium">Home</span>
            </button>
            <button
              onClick={() => setActiveSection('products')}
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-xl transition-all duration-300 ${
                activeSection === 'products' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ShoppingBag className="h-6 w-6" />
              <span className="text-xs font-medium">Products</span>
            </button>
            <button
              onClick={() => setActiveSection('milk-card')}
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-xl transition-all duration-300 ${
                activeSection === 'milk-card' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Droplet className="h-6 w-6" />
              <span className="text-xs font-medium">My Card</span>
            </button>
            <button
              onClick={() => setActiveSection('news')}
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-xl transition-all duration-300 ${
                activeSection === 'news' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Newspaper className="h-6 w-6" />
              <span className="text-xs font-medium">News</span>
            </button>
            <button
              onClick={() => setActiveSection('profile')}
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-xl transition-all duration-300 ${
                activeSection === 'profile' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <User className="h-6 w-6" />
              <span className="text-xs font-medium">Profile</span>
            </button>
          </div>
        </div>
      </nav>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out;
          animation-fill-mode: both;
        }

        .animate-slideInLeft {
          animation: slideInLeft 0.6s ease-out;
          animation-fill-mode: both;
        }

        .animate-slideInRight {
          animation: slideInRight 0.6s ease-out;
          animation-fill-mode: both;
        }

        .animate-slideInUp {
          animation: slideInUp 0.6s ease-out;
          animation-fill-mode: both;
        }
      `}</style>
    </div>
  );
};

export default CustomerPortal;
