import React, { useState, useEffect } from 'react';
import { LogOut, Package, Calendar, MapPin, Truck, Users, CheckCircle, Clock, XCircle, RefreshCw, Droplets, TrendingUp } from 'lucide-react';
import { User } from '../context/AuthContext';
import { useData } from '../context/DataContext';

interface DeliveryPartnerDashboardProps {
  user: User;
  onLogout: () => void;
}

const DeliveryPartnerDashboard: React.FC<DeliveryPartnerDashboardProps> = ({ user, onLogout }) => {
  const { deliveries, customers, dailyAllocations, deliveryPartners, updateDeliveryStatus, refreshData } = useData();
  const [activeTab, setActiveTab] = useState('overview');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [todayProgress, setTodayProgress] = useState({
    allocated: 0,
    delivered: 0,
    remaining: 0,
    completedDeliveries: 0,
    totalCustomers: 0
  });

  // Get current delivery partner info
  const currentPartner = deliveryPartners.find(dp => dp.email === user.email || dp.id === user.id);
  const partnerId = currentPartner?.id || user.id;
  const today = new Date().toISOString().split('T')[0];

  // Get assigned customers
  const assignedCustomerIds = currentPartner?.assignedCustomers || [];
  const assignedCustomers = customers.filter(c => assignedCustomerIds.includes(c.id));

  // Calculate today's progress
  useEffect(() => {
    const calculateProgress = () => {
      // Get today's allocation from supplier
      const todayAllocation = dailyAllocations.find(allocation => 
        allocation.deliveryPartnerId === partnerId && allocation.date === today
      );

      // Get today's deliveries for this partner
      const todayDeliveries = deliveries.filter(d => 
        d.deliveryPartnerId === partnerId && d.date === today
      );

      // Calculate delivered quantity from completed deliveries
      const completedDeliveries = todayDeliveries.filter(d => d.status === 'completed');
      const deliveredQuantity = completedDeliveries.reduce((sum, d) => sum + d.quantity, 0);

      // Set progress state
      const allocated = todayAllocation?.allocatedQuantity || 0;
      const remaining = allocated - deliveredQuantity;

      setTodayProgress({
        allocated,
        delivered: deliveredQuantity,
        remaining: Math.max(0, remaining),
        completedDeliveries: completedDeliveries.length,
        totalCustomers: assignedCustomers.length
      });
    };

    calculateProgress();
  }, [dailyAllocations, deliveries, partnerId, today, assignedCustomers.length]);

  // Handle delivery completion
  const handleDeliveryComplete = async (customerId: string, customerName: string, quantity: number) => {
    if (todayProgress.remaining < quantity) {
      alert(`❌ Insufficient milk quantity!\n\nTrying to deliver: ${quantity}L\nRemaining: ${todayProgress.remaining}L\n\nContact your supplier for more allocation.`);
      return;
    }

    setIsUpdating(customerId);

    try {
      // Find or create delivery record
      let delivery = deliveries.find(d => 
        d.customerId === customerId && 
        d.deliveryPartnerId === partnerId && 
        d.date === today
      );

      const deliveryId = delivery?.id || `${customerId}_${partnerId}_${today}`;

      // Update delivery status
      await updateDeliveryStatus(
        deliveryId, 
        'completed', 
        `✅ Delivered ${quantity}L to ${customerName} on ${today}`
      );

      // Refresh data to get updated state
      await refreshData();

      // Update local progress immediately for better UX
      setTodayProgress(prev => ({
        ...prev,
        delivered: prev.delivered + quantity,
        remaining: Math.max(0, prev.remaining - quantity),
        completedDeliveries: prev.completedDeliveries + 1
      }));

      alert(`✅ DELIVERY COMPLETED!\n\n👤 Customer: ${customerName}\n🥛 Delivered: ${quantity}L\n📊 Remaining: ${todayProgress.remaining - quantity}L`);

    } catch (error) {
      console.error('Error completing delivery:', error);
      alert('❌ Failed to update delivery status. Please try again.');
    } finally {
      setIsUpdating(null);
    }
  };

  // Handle delivery failure
  const handleDeliveryFailed = async (customerId: string, customerName: string) => {
    const reason = prompt(`❌ Why did the delivery to ${customerName} fail?\n\nCommon reasons:\n• Customer not available\n• Address not found\n• Customer refused delivery\n• Vehicle breakdown\n• Other`, 'Customer not available');
    
    if (!reason) return;

    setIsUpdating(customerId);

    try {
      // Find or create delivery record
      let delivery = deliveries.find(d => 
        d.customerId === customerId && 
        d.deliveryPartnerId === partnerId && 
        d.date === today
      );

      const deliveryId = delivery?.id || `${customerId}_${partnerId}_${today}`;

      // Update delivery status
      await updateDeliveryStatus(
        deliveryId, 
        'cancelled', 
        `❌ Failed delivery to ${customerName}: ${reason}`
      );

      // Refresh data
      await refreshData();

      alert(`❌ DELIVERY MARKED AS FAILED!\n\n👤 Customer: ${customerName}\n📝 Reason: ${reason}\n\n💡 No milk quantity deducted from allocation.`);

    } catch (error) {
      console.error('Error marking delivery as failed:', error);
      alert('❌ Failed to update delivery status. Please try again.');
    } finally {
      setIsUpdating(null);
    }
  };

  // Get delivery status for a customer
  const getDeliveryStatus = (customerId: string) => {
    const delivery = deliveries.find(d => 
      d.customerId === customerId && 
      d.deliveryPartnerId === partnerId && 
      d.date === today
    );
    return delivery?.status || 'pending';
  };

  // Calculate progress percentage
  const progressPercentage = todayProgress.allocated > 0 
    ? Math.round((todayProgress.delivered / todayProgress.allocated) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Delivery Partner Dashboard</h1>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Today's Allocation Progress Banner */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Today's Milk Allocation</h2>
              <p className="text-blue-100">
                Allocated: {todayProgress.allocated}L | 
                Delivered: {todayProgress.delivered}L | 
                Remaining: {todayProgress.remaining}L
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{todayProgress.allocated}L</div>
              <div className="text-blue-100">Total Allocated</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="bg-blue-300 bg-opacity-50 rounded-full h-4">
              <div 
                className="bg-gradient-to-r from-green-400 to-green-300 rounded-full h-4 transition-all duration-500"
                style={{ width: `${Math.min(100, progressPercentage)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-blue-100 mt-2">
              <span>{todayProgress.completedDeliveries} of {todayProgress.totalCustomers} deliveries completed</span>
              <span>{progressPercentage}% Complete</span>
            </div>
            {progressPercentage === 100 && todayProgress.totalCustomers > 0 && (
              <div className="mt-2 text-center">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  🎉 All deliveries completed for today!
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-8 mb-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('deliveries')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'deliveries'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Deliveries
          </button>
        </nav>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-3 rounded-md bg-blue-50">
                    <Droplets className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{todayProgress.allocated}L</h3>
                    <p className="text-sm text-gray-500">Today's Allocation</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-3 rounded-md bg-green-50">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{todayProgress.delivered}L</h3>
                    <p className="text-sm text-gray-500">Delivered</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-3 rounded-md bg-yellow-50">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{todayProgress.remaining}L</h3>
                    <p className="text-sm text-gray-500">Remaining</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-3 rounded-md bg-purple-50">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{todayProgress.completedDeliveries}/{todayProgress.totalCustomers}</h3>
                    <p className="text-sm text-gray-500">Completed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
                <button
                  onClick={refreshData}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh Data</span>
                </button>
              </div>
              <div className="text-sm text-gray-600 space-y-2">
                <p>• View and manage customer deliveries in the "Deliveries" tab</p>
                <p>• Mark deliveries as completed or failed</p>
                <p>• Track your progress with the real-time progress bar</p>
                <p>• Your remaining milk quantity updates automatically</p>
              </div>
            </div>
          </div>
        )}

        {/* Deliveries Tab */}
        {activeTab === 'deliveries' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Truck className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Today's Deliveries</h3>
                    <p className="text-sm text-gray-500">Manage your customer deliveries for {today}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{assignedCustomers.length}</div>
                  <div className="text-sm text-gray-500">Total Customers</div>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {assignedCustomers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Customers Assigned</h3>
                  <p>You don't have any customers assigned for delivery.</p>
                  <p className="text-sm mt-2">Contact your supplier to get customer assignments.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {assignedCustomers.map((customer) => {
                    const status = getDeliveryStatus(customer.id);
                    const isCompleted = status === 'completed';
                    const isFailed = status === 'cancelled';
                    const isPending = status === 'pending';
                    
                    return (
                      <div key={customer.id} className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="p-3 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100">
                              <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="text-xl font-semibold text-gray-900">{customer.name}</h4>
                              <div className="space-y-1 mt-2">
                                <p className="text-sm text-gray-600 flex items-center">
                                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                                  {customer.address}
                                </p>
                                <p className="text-sm text-gray-600">📱 {customer.phone}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600 mb-2">{customer.dailyQuantity}L</div>
                            <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                              isCompleted 
                                ? 'bg-green-100 text-green-800' 
                                : isFailed
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {isCompleted ? '✅ Completed' : isFailed ? '❌ Failed' : '⏳ Pending'}
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex justify-center space-x-6">
                          <button
                            onClick={() => handleDeliveryComplete(customer.id, customer.name, customer.dailyQuantity)}
                            disabled={isCompleted || isUpdating === customer.id}
                            className={`flex items-center space-x-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
                              isCompleted
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : isUpdating === customer.id
                                ? 'bg-blue-500 text-white cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg transform hover:scale-105'
                            }`}
                          >
                            {isUpdating === customer.id ? (
                              <>
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                <span>Processing...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-6 w-6" />
                                <span>{isCompleted ? 'Completed ✓' : 'Mark Completed'}</span>
                              </>
                            )}
                          </button>
                          
                          <button
                            onClick={() => handleDeliveryFailed(customer.id, customer.name)}
                            disabled={isFailed || isUpdating === customer.id}
                            className={`flex items-center space-x-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
                              isFailed
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : isUpdating === customer.id
                                ? 'bg-blue-500 text-white cursor-not-allowed'
                                : 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg transform hover:scale-105'
                            }`}
                          >
                            {isUpdating === customer.id ? (
                              <>
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                <span>Processing...</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-6 w-6" />
                                <span>{isFailed ? 'Failed ✗' : 'Mark Failed'}</span>
                              </>
                            )}
                          </button>
                        </div>
                        
                        {/* Status Message */}
                        {(isCompleted || isFailed) && (
                          <div className="mt-4 p-3 bg-white rounded-lg border">
                            <div className="text-sm font-medium text-gray-700">
                              {isCompleted ? 
                                `✅ Delivery completed successfully - ${customer.dailyQuantity}L delivered` : 
                                '❌ Delivery failed - No quantity deducted from allocation'}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryPartnerDashboard;