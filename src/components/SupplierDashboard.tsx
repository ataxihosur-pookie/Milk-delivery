import React, { useState } from 'react';
import { LogOut, Plus, Truck, Users, Package, Calendar, Milk, UserPlus } from 'lucide-react';
import { User } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import AllocateMilk from './AllocateMilk';
import AddDeliveryPartner from './AddDeliveryPartner';
import CustomerAssignment from './CustomerAssignment';
import SupplierPricing from './SupplierPricing';

interface SupplierDashboardProps {
  user: User;
  onLogout: () => void;
}

const SupplierDashboard: React.FC<SupplierDashboardProps> = ({ user, onLogout }) => {
  const { deliveryPartners, customers, deliveries, suppliers, dailyAllocations, farmers, pickupLogs, addDeliveryPartner, addCustomer, addFarmer, addPickupLog, assignCustomersToPartner, updateCustomerStatus, deleteCustomer, updateDeliveryPartnerStatus, deleteDeliveryPartner, refreshData } = useData();
  const [activeTab, setActiveTab] = useState('overview');
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [showAllocateMilk, setShowAllocateMilk] = useState(false);
  const [showAddPartner, setShowAddPartner] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [downloadStartDate, setDownloadStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [downloadEndDate, setDownloadEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    dailyQuantity: '',
    assignedPartnerId: undefined as string | undefined
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // New farmer form state
  const [newFarmer, setNewFarmer] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: ''
  });

  // Milk intake form state
  const [milkIntake, setMilkIntake] = useState({
    farmerId: '',
    quantity: 0,
    qualityGrade: 'A' as 'A' | 'B' | 'C',
    fatContent: 0,
    pricePerLiter: 0,
    notes: ''
  });

  const supplier = suppliers.find(s => s.id === user.id || s.email === user.email);
  const supplierId = supplier?.id || user.id;
  const myDeliveryPartners = deliveryPartners.filter(dp => dp.supplierId === supplierId);
  const myCustomers = customers.filter(c => c.supplierId === supplierId);
  const myDeliveries = deliveries.filter(d => d.supplierId === supplierId);
  const myAllocations = dailyAllocations.filter(a => a.supplierId === supplierId);
  const myFarmers = farmers.filter(f => f.supplierId === supplierId);
  const myPickupLogs = pickupLogs.filter(p => p.supplierId === supplierId);

  const todayDeliveries = myDeliveries.filter(d => d.date === selectedDate);
  const todayAllocations = myAllocations.filter(a => a.date === selectedDate);
  const completedToday = todayDeliveries.filter(d => d.status === 'completed').length;
  const pendingToday = todayDeliveries.filter(d => d.status === 'pending').length;

  // Handle add new farmer
  const handleAddFarmer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newFarmer.name || !newFarmer.phone || !newFarmer.password) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);

      const userId = `farmer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await addFarmer({
        name: newFarmer.name,
        email: newFarmer.email,
        phone: newFarmer.phone,
        address: newFarmer.address,
        supplierId: supplierId,
        userId: userId,
        password: newFarmer.password,
        status: 'active'
      });

      alert(`Farmer "${newFarmer.name}" added successfully!\n\nPhone: ${newFarmer.phone}\nPassword: ${newFarmer.password}`);

      setNewFarmer({
        name: '',
        email: '',
        phone: '',
        address: '',
        password: ''
      });

      await refreshData();
    } catch (error) {
      console.error('Error adding farmer:', error);
      alert('Failed to add farmer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle record milk intake
  const handleRecordMilkIntake = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!milkIntake.farmerId || milkIntake.quantity <= 0 || milkIntake.pricePerLiter <= 0) {
      alert('Please select a farmer and enter valid quantity and price');
      return;
    }

    try {
      setIsSubmitting(true);

      const totalAmount = milkIntake.quantity * milkIntake.pricePerLiter;

      await addPickupLog({
        farmerId: milkIntake.farmerId,
        supplierId: supplierId,
        quantity: milkIntake.quantity,
        qualityGrade: milkIntake.qualityGrade,
        fatContent: milkIntake.fatContent,
        pricePerLiter: milkIntake.pricePerLiter,
        totalAmount: totalAmount,
        date: selectedDate,
        pickupTime: new Date().toISOString(),
        status: 'completed',
        notes: milkIntake.notes,
        createdAt: new Date().toISOString()
      });

      const farmer = myFarmers.find(f => f.id === milkIntake.farmerId);
      alert(`Milk intake recorded!\n\nFarmer: ${farmer?.name}\nQuantity: ${milkIntake.quantity}L\nQuality: ${milkIntake.qualityGrade}\nPrice: ₹${milkIntake.pricePerLiter}/L\nTotal: ₹${totalAmount.toFixed(2)}`);

      setMilkIntake({
        farmerId: '',
        quantity: 0,
        qualityGrade: 'A',
        fatContent: 0,
        pricePerLiter: 0,
        notes: ''
      });

      await refreshData();
    } catch (error) {
      console.error('Error recording milk intake:', error);
      alert('Failed to record milk intake. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const customerData = {
        name: newCustomerData.name,
        email: newCustomerData.email,
        phone: newCustomerData.phone,
        address: newCustomerData.address,
        supplierId: supplierId,
        dailyQuantity: parseInt(newCustomerData.dailyQuantity)
      };

      const newCustomer = await addCustomer(customerData);
      
      // If a delivery partner was selected, assign this customer to them
      if (newCustomerData.assignedPartnerId) {
        try {
          // Wait a moment for the customer to be fully created
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const customerId = newCustomer?.id || customerData.name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
          if (customerId) {
            console.log('Assigning customer to partner:', {
              partnerId: newCustomerData.assignedPartnerId,
              customerId
            });
            
            // Get current assignments for this partner
            const partner = myDeliveryPartners.find(p => p.id === newCustomerData.assignedPartnerId);
            const existingCustomers = partner?.assignedCustomers || [];
            
            // Add the new customer to the assignments
            const updatedCustomers = [...existingCustomers, customerId];
            await assignCustomersToPartner(newCustomerData.assignedPartnerId, updatedCustomers);
            
            console.log('Customer assignment completed:', {
              partnerId: newCustomerData.assignedPartnerId,
              totalCustomers: updatedCustomers.length
            });
            
            // Force refresh data to ensure UI updates
            setTimeout(async () => {
              await refreshData();
              // Force component re-render
              setActiveTab('overview');
              setTimeout(() => setActiveTab('customers'), 50);
            }, 200);
          }
        } catch (assignError) {
          console.warn('Customer created but assignment failed:', assignError);
          // Customer was created successfully, just assignment failed
        }
      }
      
      alert('Customer added successfully!');
      setShowNewCustomerForm(false);
      setNewCustomerData({ name: '', email: '', phone: '', address: '', dailyQuantity: '', assignedPartnerId: undefined });
      
    } catch (error: any) {
      console.error('Error adding customer:', error);
      setError(error.message || 'Failed to add customer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleCustomerStatus = async (customerId: string, newStatus: 'active' | 'paused') => {
    try {
      await updateCustomerStatus(customerId, newStatus);
      await refreshData();
      alert(`Customer ${newStatus === 'paused' ? 'paused' : 'activated'} successfully!`);
    } catch (error) {
      console.error('Error updating customer status:', error);
      alert('Failed to update customer status');
    }
  };

  const handleDeleteCustomer = async (customerId: string, customerName: string) => {
    if (!confirm(`Are you sure you want to delete customer "${customerName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteCustomer(customerId);
      await refreshData();
      alert('Customer deleted successfully!');
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Failed to delete customer');
    }
  };

  const handleTogglePartnerStatus = async (partnerId: string, newStatus: 'active' | 'paused') => {
    try {
      await updateDeliveryPartnerStatus(partnerId, newStatus);
      await refreshData();
      alert(`Delivery partner ${newStatus === 'paused' ? 'paused' : 'activated'} successfully!`);
    } catch (error) {
      console.error('Error updating partner status:', error);
      alert('Failed to update partner status');
    }
  };

  const handleDeletePartner = async (partnerId: string, partnerName: string) => {
    if (!confirm(`Are you sure you want to delete delivery partner "${partnerName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteDeliveryPartner(partnerId);
      await refreshData();
      alert('Delivery partner deleted successfully!');
    } catch (error) {
      console.error('Error deleting delivery partner:', error);
      alert('Failed to delete delivery partner');
    }
  };

  const downloadCSV = (data: string[][], filename: string) => {
    const csv = data.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadDeliveries = () => {
    const filteredDeliveries = myDeliveries.filter(d => {
      const deliveryDate = new Date(d.date).toISOString().split('T')[0];
      return deliveryDate >= downloadStartDate && deliveryDate <= downloadEndDate;
    });

    if (filteredDeliveries.length === 0) {
      alert('No deliveries found for the selected date range');
      return;
    }

    const headers = ['Date', 'Customer', 'Delivery Partner', 'Quantity (L)', 'Status', 'Notes'];
    const rows = filteredDeliveries.map(d => {
      const customer = myCustomers.find(c => c.id === d.customerId);
      const partner = myDeliveryPartners.find(p => p.id === d.deliveryPartnerId);
      return [
        new Date(d.date).toLocaleDateString(),
        customer?.name || 'Unknown',
        partner?.name || 'Unknown',
        d.quantity.toString(),
        d.status,
        d.notes || ''
      ];
    });

    downloadCSV([headers, ...rows], `deliveries_${downloadStartDate}_to_${downloadEndDate}.csv`);
    alert(`Downloaded ${filteredDeliveries.length} delivery records`);
  };

  const handleDownloadMilkIntake = () => {
    const filteredPickups = myPickupLogs.filter(p => {
      const pickupDate = new Date(p.date).toISOString().split('T')[0];
      return pickupDate >= downloadStartDate && pickupDate <= downloadEndDate;
    });

    if (filteredPickups.length === 0) {
      alert('No milk intake records found for the selected date range');
      return;
    }

    const headers = ['Date', 'Farmer', 'Delivery Partner', 'Quantity (L)', 'Quality', 'Fat %', 'Price/L', 'Total Amount', 'Status', 'Notes'];
    const rows = filteredPickups.map(p => {
      const farmer = farmers.find(f => f.id === p.farmerId);
      const partner = myDeliveryPartners.find(dp => dp.id === p.deliveryPartnerId);
      return [
        new Date(p.date).toLocaleDateString(),
        farmer?.name || 'Unknown',
        partner?.name || 'Unknown',
        p.quantity.toString(),
        p.qualityGrade,
        p.fatContent.toString(),
        p.pricePerLiter.toString(),
        p.totalAmount.toFixed(2),
        p.status,
        p.notes || ''
      ];
    });

    downloadCSV([headers, ...rows], `milk_intake_${downloadStartDate}_to_${downloadEndDate}.csv`);
    alert(`Downloaded ${filteredPickups.length} milk intake records`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Supplier Dashboard</h1>
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
        <nav className="flex space-x-8 mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('delivery-partners')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'delivery-partners'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Delivery Partners
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'customers'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Customers
          </button>
          <button
            onClick={() => setActiveTab('farmers')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'farmers'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Farmers
          </button>
          <button
            onClick={() => setActiveTab('milk-intake')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'milk-intake'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Milk Intake
          </button>
          <button
            onClick={() => setActiveTab('deliveries')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'deliveries'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Deliveries
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'assignments'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Customer Assignment
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'pricing'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pricing
          </button>
          <button
            onClick={() => setActiveTab('temp-deliveries')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'temp-deliveries'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Temporary Deliveries
          </button>
        </nav>

        {activeTab === 'overview' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-3 rounded-md bg-blue-50">
                    <Truck className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{myDeliveryPartners.length}</h3>
                    <p className="text-sm text-gray-500">Delivery Partners</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-3 rounded-md bg-green-50">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{myCustomers.length}</h3>
                    <p className="text-sm text-gray-500">Customers</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-3 rounded-md bg-yellow-50">
                    <Package className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{completedToday}</h3>
                    <p className="text-sm text-gray-500">Completed Today</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-3 rounded-md bg-purple-50">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{pendingToday}</h3>
                    <p className="text-sm text-gray-500">Pending Today</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowAddPartner(true)}
                    className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Delivery Partner
                  </button>
                  <button
                    onClick={() => setShowNewCustomerForm(true)}
                    className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Customer
                  </button>
                  <button
                    onClick={() => setShowAllocateMilk(true)}
                    className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Allocate Milk
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Total Deliveries</span>
                    <span className="text-sm font-medium">{todayDeliveries.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Completed</span>
                    <span className="text-sm font-medium text-green-600">{completedToday}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Pending</span>
                    <span className="text-sm font-medium text-yellow-600">{pendingToday}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Active Partners</span>
                    <span className="text-sm font-medium">{myDeliveryPartners.filter(dp => dp.status === 'active').length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'delivery-partners' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Delivery Partners</h3>
                <button
                  onClick={() => setShowAddPartner(true)}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Partner</span>
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Password
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {myDeliveryPartners.map((partner) => (
                    <tr key={partner.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {partner.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {partner.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 bg-gray-50">
                        {partner.password}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {partner.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {partner.vehicleNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          partner.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {partner.status === 'active' ? 'Active' : 'Paused'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleTogglePartnerStatus(partner.id, partner.status === 'active' ? 'paused' : 'active')}
                            className={`px-3 py-1 rounded text-xs font-medium ${
                              partner.status === 'active'
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {partner.status === 'active' ? 'Pause' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeletePartner(partner.id, partner.name)}
                            className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-xs font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Customers</h3>
                <button
                  onClick={() => setShowNewCustomerForm(true)}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Customer</span>
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Daily Qty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {myCustomers
                    .filter(customer => !customer.name.startsWith('[TEMP]'))
                    .map((customer) => (
                    <tr key={customer.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {customer.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {customer.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {customer.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {customer.address}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {customer.dailyQuantity}L
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          (customer as any).status === 'paused'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {(customer as any).status === 'paused' ? 'Paused' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleToggleCustomerStatus(customer.id, (customer as any).status === 'paused' ? 'active' : 'paused')}
                            className={`px-3 py-1 rounded text-xs font-medium ${
                              (customer as any).status === 'paused'
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            }`}
                          >
                            {(customer as any).status === 'paused' ? 'Activate' : 'Pause'}
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(customer.id, customer.name)}
                            className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-xs font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'deliveries' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">All Deliveries</h3>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">From:</label>
                  <input
                    type="date"
                    value={downloadStartDate}
                    onChange={(e) => setDownloadStartDate(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">To:</label>
                  <input
                    type="date"
                    value={downloadEndDate}
                    onChange={(e) => setDownloadEndDate(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <button
                  onClick={handleDownloadDeliveries}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  <Package className="h-4 w-4" />
                  <span>Download CSV</span>
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Delivery Partner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {myDeliveries.map((delivery) => {
                    const customer = myCustomers.find(c => c.id === delivery.customerId);
                    const partner = myDeliveryPartners.find(dp => dp.id === delivery.deliveryPartnerId);
                    return (
                      <tr key={delivery.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {customer?.name || 'Unknown Customer'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {partner?.name || 'Unknown Partner'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {delivery.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {delivery.quantity}L
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            delivery.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : delivery.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {delivery.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'assignments' && (
          <CustomerAssignment supplierId={supplierId} />
        )}

        {activeTab === 'pricing' && (
          <SupplierPricing supplierId={supplierId} />
        )}

        {/* Temporary Deliveries Tab */}
        {activeTab === 'temp-deliveries' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Temporary Deliveries</h3>
                <p className="text-sm text-gray-500">View one-time deliveries recorded by delivery partners</p>
              </div>
            </div>

            <div className="space-y-3">
              {myDeliveries
                .filter(d => {
                  const customer = myCustomers.find(c => c.id === d.customerId);
                  return customer && customer.name.startsWith('[TEMP]');
                })
                .map(delivery => {
                  const customer = myCustomers.find(c => c.id === delivery.customerId);
                  const partner = myDeliveryPartners.find(p => p.id === delivery.deliveryPartnerId);
                  if (!customer) return null;

                  return (
                    <div key={delivery.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900">{customer.name.replace('[TEMP] ', '')}</p>
                          <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                            Temporary
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">Phone: {customer.phone}</p>
                        <p className="text-sm text-gray-600">Address: {customer.address}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Delivered by: {partner?.name || 'Unknown Partner'}
                        </p>
                        {delivery.notes && (
                          <p className="text-sm text-gray-500 italic mt-1">{delivery.notes}</p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-lg font-bold text-blue-600">{delivery.quantity}L</p>
                        <p className="text-sm text-gray-500">{new Date(delivery.scheduledTime).toLocaleDateString()}</p>
                        <span className={`inline-block px-3 py-1 mt-2 text-xs font-medium rounded-full ${
                          delivery.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : delivery.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {delivery.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              {myDeliveries.filter(d => {
                const customer = myCustomers.find(c => c.id === d.customerId);
                return customer && customer.name.startsWith('[TEMP]');
              }).length === 0 && (
                <p className="text-center text-gray-500 py-12">No temporary deliveries recorded</p>
              )}
            </div>
          </div>
        )}

        {/* Farmers Tab */}
        {activeTab === 'farmers' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <UserPlus className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Farmer Management</h3>
                  <p className="text-sm text-gray-500">Add and manage farmers</p>
                </div>
              </div>
            </div>

            {/* Add Farmer Form */}
            <form onSubmit={handleAddFarmer} className="mb-8 p-6 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-4">Add New Farmer</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Farmer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newFarmer.name}
                    onChange={(e) => setNewFarmer({ ...newFarmer, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter farmer name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={newFarmer.phone}
                    onChange={(e) => setNewFarmer({ ...newFarmer, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Phone (used for login)"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={newFarmer.password}
                    onChange={(e) => setNewFarmer({ ...newFarmer, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Login password"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newFarmer.email}
                    onChange={(e) => setNewFarmer({ ...newFarmer, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="farmer@example.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    value={newFarmer.address}
                    onChange={(e) => setNewFarmer({ ...newFarmer, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter farmer address"
                    rows={2}
                  />
                </div>
              </div>

              <div className="mt-4 flex space-x-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Adding...' : 'Add Farmer'}
                </button>
                <button
                  type="button"
                  onClick={() => setNewFarmer({ name: '', email: '', phone: '', address: '', password: '' })}
                  className="px-6 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Clear
                </button>
              </div>
            </form>

            {/* Farmers List */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Registered Farmers ({myFarmers.length})</h4>
              <div className="space-y-3">
                {myFarmers.map(farmer => (
                  <div key={farmer.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                    <div>
                      <p className="font-medium text-gray-900">{farmer.name}</p>
                      <p className="text-sm text-gray-500">Phone: {farmer.phone}</p>
                      <p className="text-sm text-gray-500">{farmer.address}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                        farmer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {farmer.status}
                      </span>
                    </div>
                  </div>
                ))}
                {myFarmers.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No farmers registered yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Milk Intake Tab */}
        {activeTab === 'milk-intake' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Milk className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Record Milk Intake</h3>
                  <p className="text-sm text-gray-500">Log milk collected from farmers with quality and pricing</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={downloadStartDate}
                  onChange={(e) => setDownloadStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={downloadEndDate}
                  onChange={(e) => setDownloadEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <button
                  onClick={handleDownloadMilkIntake}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  <Milk className="h-4 w-4" />
                  <span>Download CSV</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleRecordMilkIntake} className="mb-8 space-y-4 max-w-3xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Farmer <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={milkIntake.farmerId}
                    onChange={(e) => setMilkIntake({ ...milkIntake, farmerId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Choose a farmer</option>
                    {myFarmers
                      .filter(f => f.status === 'active')
                      .map(farmer => (
                        <option key={farmer.id} value={farmer.id}>
                          {farmer.name} - {farmer.phone}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity (Liters) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={milkIntake.quantity || ''}
                    onChange={(e) => setMilkIntake({ ...milkIntake, quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter quantity"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quality Grade <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={milkIntake.qualityGrade}
                    onChange={(e) => setMilkIntake({ ...milkIntake, qualityGrade: e.target.value as 'A' | 'B' | 'C' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="A">Grade A (Premium)</option>
                    <option value="B">Grade B (Standard)</option>
                    <option value="C">Grade C (Basic)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fat Content (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={milkIntake.fatContent || ''}
                    onChange={(e) => setMilkIntake({ ...milkIntake, fatContent: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Fat percentage"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price per Liter (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={milkIntake.pricePerLiter || ''}
                    onChange={(e) => setMilkIntake({ ...milkIntake, pricePerLiter: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Price per liter"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Amount (₹)
                  </label>
                  <input
                    type="text"
                    value={`₹${(milkIntake.quantity * milkIntake.pricePerLiter).toFixed(2)}`}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    disabled
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={milkIntake.notes}
                    onChange={(e) => setMilkIntake({ ...milkIntake, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional notes (optional)"
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Recording...' : 'Record Milk Intake'}
                </button>
                <button
                  type="button"
                  onClick={() => setMilkIntake({ farmerId: '', quantity: 0, qualityGrade: 'A', fatContent: 0, pricePerLiter: 0, notes: '' })}
                  className="px-6 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Clear
                </button>
              </div>
            </form>

            {/* Today's Pickup Logs */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Today's Milk Collection ({myPickupLogs.filter(p => p.date === selectedDate).length})</h4>
              <div className="space-y-3">
                {myPickupLogs
                  .filter(p => p.date === selectedDate)
                  .map(log => {
                    const farmer = myFarmers.find(f => f.id === log.farmerId);
                    return (
                      <div key={log.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{farmer?.name || 'Unknown Farmer'}</p>
                          <p className="text-sm text-gray-500">Quality: {log.qualityGrade} | Fat: {log.fatContent}% | {log.notes}</p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-lg font-bold text-blue-600">{log.quantity}L</p>
                          <p className="text-sm text-gray-600">₹{log.pricePerLiter}/L</p>
                          <p className="text-sm font-semibold text-green-600">₹{log.totalAmount.toFixed(2)}</p>
                        </div>
                      </div>
                    );
                  })}
                {myPickupLogs.filter(p => p.date === selectedDate).length === 0 && (
                  <p className="text-center text-gray-500 py-8">No milk intake recorded today</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* New Customer Form Modal */}
        {showNewCustomerForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add New Customer</h3>
                <button
                  onClick={() => setShowNewCustomerForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleNewCustomerSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustomerData.name}
                    onChange={(e) => setNewCustomerData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter customer's full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={newCustomerData.email}
                    onChange={(e) => setNewCustomerData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number * (Required)
                  </label>
                  <input
                    type="tel"
                    required
                    value={newCustomerData.phone}
                    onChange={(e) => setNewCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50"
                    placeholder="Enter phone number (mandatory)"
                  />
                  <p className="text-xs text-blue-600 mt-1">Phone number is required for delivery coordination</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Address *
                  </label>
                  <textarea
                    required
                    value={newCustomerData.address}
                    onChange={(e) => setNewCustomerData(prev => ({ ...prev, address: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter complete delivery address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Daily Milk Quantity (Liters) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    value={newCustomerData.dailyQuantity}
                    onChange={(e) => setNewCustomerData(prev => ({ ...prev, dailyQuantity: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter daily requirement in liters"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign Delivery Partner (Optional)
                  </label>
                  {myDeliveryPartners.length > 0 ? (
                    <select
                      name="assignedPartnerId"
                      value={newCustomerData.assignedPartnerId || ''}
                      onChange={(e) => setNewCustomerData(prev => ({ 
                        ...prev, 
                        assignedPartnerId: e.target.value || undefined 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a delivery partner (optional)</option>
                      {myDeliveryPartners.map((partner) => (
                        <option key={partner.id} value={partner.id}>
                          {partner.name} - {partner.vehicleNumber}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500 text-sm">
                      No delivery partners available. Add delivery partners first.
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    You can assign this customer to a delivery partner now or later
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    {error}
                  </div>
                )}

                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewCustomerForm(false)}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                  >
                    {isSubmitting ? 'Adding...' : 'Add Customer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showAllocateMilk && (
          <AllocateMilk
            supplierId={supplierId}
            onClose={() => setShowAllocateMilk(false)}
          />
        )}

        {showAddPartner && (
          <AddDeliveryPartner
            supplierId={supplierId}
            onClose={() => setShowAddPartner(false)}
            onSuccess={() => {
              refreshData();
              setShowAddPartner(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default SupplierDashboard;