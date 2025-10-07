import React from 'react';
import { LogOut, Package, Calendar, MapPin, Truck } from 'lucide-react';
import { User } from '../context/AuthContext';
import { useData } from '../context/DataContext';

interface CustomerPortalProps {
  user: User;
  onLogout: () => void;
}

const CustomerPortal: React.FC<CustomerPortalProps> = ({ user, onLogout }) => {
  const { deliveries, deliveryPartners, customers } = useData();
  
  const customer = customers.find(c => c.email === user.email);
  const myDeliveries = deliveries.filter(d => d.customerId === (customer?.id || user.id));
  
  // Get recent deliveries (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentDeliveries = myDeliveries
    .filter(d => new Date(d.date) >= sevenDaysAgo)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const todayDeliveries = myDeliveries.filter(d => d.date === new Date().toISOString().split('T')[0]);
  const nextDelivery = todayDeliveries.find(d => d.status === 'pending');

  const getDeliveryPartnerName = (deliveryPartnerId: string) => {
    const partner = deliveryPartners.find(dp => dp.id === deliveryPartnerId);
    return partner?.name || 'Unknown Partner';
  };

  const getDeliveryPartnerVehicle = (deliveryPartnerId: string) => {
    const partner = deliveryPartners.find(dp => dp.id === deliveryPartnerId);
    return partner?.vehicleNumber || 'N/A';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">My Milk Deliveries</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Welcome, {user.name}</span>
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Customer Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-blue-50">
              <MapPin className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">{customer?.name || user.name}</h3>
              <p className="text-sm text-gray-500">{customer?.address}</p>
              <p className="text-sm text-gray-500">Daily Requirement: {customer?.dailyQuantity}L</p>
            </div>
          </div>
        </div>

        {/* Next Delivery */}
        {nextDelivery && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border-l-4 border-blue-500">
            <div className="flex items-center mb-4">
              <Truck className="h-6 w-6 text-blue-600 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">Today's Delivery</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Delivery Partner</p>
                <p className="font-medium text-gray-900">{getDeliveryPartnerName(nextDelivery.deliveryPartnerId)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Vehicle Number</p>
                <p className="font-medium text-gray-900">{getDeliveryPartnerVehicle(nextDelivery.deliveryPartnerId)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Quantity</p>
                <p className="font-medium text-gray-900">{nextDelivery.quantity}L</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Status</p>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  nextDelivery.status === 'completed' 
                    ? 'bg-green-100 text-green-800' 
                    : nextDelivery.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {nextDelivery.status === 'pending' ? 'On the way' : nextDelivery.status}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Recent Deliveries */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <Package className="h-6 w-6 text-gray-600 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">Recent Deliveries</h3>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {recentDeliveries.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No recent deliveries found.
              </div>
            ) : (
              recentDeliveries.map((delivery) => (
                <div key={delivery.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 rounded-md bg-gray-100">
                        <Calendar className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {new Date(delivery.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="text-sm text-gray-500">
                          {delivery.quantity}L delivered by {getDeliveryPartnerName(delivery.deliveryPartnerId)}
                        </p>
                        {delivery.scheduledTime && (
                          <p className="text-xs text-gray-400">
                            Scheduled: {delivery.scheduledTime}
                            {delivery.completedTime && ` • Delivered: ${new Date(delivery.completedTime).toLocaleTimeString()}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                        delivery.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : delivery.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {delivery.status}
                      </span>
                    </div>
                  </div>
                  {delivery.notes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-600">{delivery.notes}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerPortal;