import React, { useState, useEffect } from 'react';
import { LogOut, Package, Calendar, MapPin, Truck, FileText, Filter, ChevronDown } from 'lucide-react';
import { User } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import type { MonthlyInvoice, InvoiceLineItem } from '../lib/customerService';

interface CustomerPortalProps {
  user: User;
  onLogout: () => void;
}

const CustomerPortal: React.FC<CustomerPortalProps> = ({ user, onLogout }) => {
  const { deliveries, deliveryPartners, customers, getCustomerInvoices, getInvoiceLineItems } = useData();
  const [activeTab, setActiveTab] = useState('deliveries');
  const [invoices, setInvoices] = useState<MonthlyInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<MonthlyInvoice | null>(null);
  const [invoiceLineItems, setInvoiceLineItems] = useState<InvoiceLineItem[]>([]);
  const [dateFilter, setDateFilter] = useState('last7');
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);

  const customerPhone = user.phone || user.email;
  const customer = customers.find(c => c.phone === customerPhone || c.email === user.email);
  const myDeliveries = deliveries.filter(d => d.customerId === (customer?.id || user.id));

  useEffect(() => {
    if (activeTab === 'invoices' && customerPhone) {
      loadInvoices();
    }
  }, [activeTab, customerPhone]);

  const loadInvoices = async () => {
    try {
      setIsLoadingInvoices(true);
      const data = await getCustomerInvoices(customerPhone);
      setInvoices(data);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  const loadInvoiceDetails = async (invoice: MonthlyInvoice) => {
    try {
      const lineItems = await getInvoiceLineItems(invoice.id);
      setInvoiceLineItems(lineItems);
      setSelectedInvoice(invoice);
    } catch (error) {
      console.error('Error loading invoice details:', error);
    }
  };

  const getFilteredDeliveries = () => {
    const now = new Date();
    let filteredDeliveries = [...myDeliveries];

    switch (dateFilter) {
      case 'last7':
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        filteredDeliveries = filteredDeliveries.filter(d => new Date(d.date) >= sevenDaysAgo);
        break;
      case 'last30':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        filteredDeliveries = filteredDeliveries.filter(d => new Date(d.date) >= thirtyDaysAgo);
        break;
      case 'thisMonth':
        filteredDeliveries = filteredDeliveries.filter(d => {
          const deliveryDate = new Date(d.date);
          return deliveryDate.getMonth() === now.getMonth() && deliveryDate.getFullYear() === now.getFullYear();
        });
        break;
      case 'lastMonth':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        filteredDeliveries = filteredDeliveries.filter(d => {
          const deliveryDate = new Date(d.date);
          return deliveryDate.getMonth() === lastMonth.getMonth() && deliveryDate.getFullYear() === lastMonth.getFullYear();
        });
        break;
    }

    return filteredDeliveries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const todayDeliveries = myDeliveries.filter(d => d.date === new Date().toISOString().split('T')[0]);
  const nextDelivery = todayDeliveries.find(d => d.status === 'pending');
  const filteredDeliveries = getFilteredDeliveries();

  const getDeliveryPartnerName = (deliveryPartnerId: string) => {
    const partner = deliveryPartners.find(dp => dp.id === deliveryPartnerId);
    return partner?.name || 'Unknown Partner';
  };

  const getDeliveryPartnerVehicle = (deliveryPartnerId: string) => {
    const partner = deliveryPartners.find(dp => dp.id === deliveryPartnerId);
    return partner?.vehicleNumber || 'N/A';
  };

  const getMonthName = (month: number) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1];
  };

  const currentMonthDeliveries = myDeliveries.filter(d => {
    const deliveryDate = new Date(d.date);
    const now = new Date();
    return deliveryDate.getMonth() === now.getMonth() &&
           deliveryDate.getFullYear() === now.getFullYear() &&
           d.status === 'completed';
  });

  const currentMonthTotal = currentMonthDeliveries.reduce((sum, d) => sum + d.quantity, 0);

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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Customer Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 rounded-md bg-blue-50">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">{customer?.name || user.name}</h3>
                <p className="text-sm text-gray-500">{customer?.address}</p>
                <p className="text-sm text-gray-500">Phone: {customerPhone}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Daily Requirement</p>
              <p className="text-2xl font-bold text-blue-600">{customer?.dailyQuantity || 0}L</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">This Month</p>
                <p className="text-2xl font-bold text-gray-900">{currentMonthDeliveries.length}</p>
                <p className="text-xs text-gray-400">Deliveries</p>
              </div>
              <Package className="h-10 w-10 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Quantity</p>
                <p className="text-2xl font-bold text-gray-900">{currentMonthTotal.toFixed(1)}L</p>
                <p className="text-xs text-gray-400">This month</p>
              </div>
              <Truck className="h-10 w-10 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Invoices</p>
                <p className="text-2xl font-bold text-gray-900">{invoices.filter(i => i.status === 'pending').length}</p>
                <p className="text-xs text-gray-400">To be paid</p>
              </div>
              <FileText className="h-10 w-10 text-orange-500" />
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800">
                  On the way
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('deliveries')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'deliveries'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4" />
                  <span>Delivery History</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('invoices')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'invoices'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Monthly Invoices</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Deliveries Tab */}
          {activeTab === 'deliveries' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Delivery History</h3>
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="last7">Last 7 Days</option>
                    <option value="last30">Last 30 Days</option>
                    <option value="thisMonth">This Month</option>
                    <option value="lastMonth">Last Month</option>
                  </select>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {filteredDeliveries.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    No deliveries found for the selected period.
                  </div>
                ) : (
                  filteredDeliveries.map((delivery) => (
                    <div key={delivery.id} className="py-4">
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
                        <div className="mt-3 p-3 bg-gray-50 rounded-md ml-12">
                          <p className="text-sm text-gray-600">{delivery.notes}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <div className="p-6">
              {isLoadingInvoices ? (
                <div className="py-12 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : invoices.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p>No invoices available yet.</p>
                  <p className="text-sm mt-2">Invoices are generated monthly based on your deliveries.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">
                            {getMonthName(invoice.month)} {invoice.year}
                          </h4>
                          <p className="text-sm text-gray-500">Invoice #{invoice.invoiceNumber}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">₹{invoice.totalAmount.toFixed(2)}</p>
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            invoice.status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : invoice.status === 'overdue'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {invoice.status.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-gray-200">
                        <div>
                          <p className="text-xs text-gray-500">Total Deliveries</p>
                          <p className="text-lg font-semibold text-gray-900">{invoice.deliveryCount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Total Quantity</p>
                          <p className="text-lg font-semibold text-gray-900">{invoice.totalQuantity.toFixed(1)}L</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Price Per Liter</p>
                          <p className="text-lg font-semibold text-gray-900">₹{invoice.pricePerLiter.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Due Date: {new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                        <button
                          onClick={() => loadInvoiceDetails(invoice)}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
                        >
                          <span>View Details</span>
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </div>

                      {selectedInvoice?.id === invoice.id && invoiceLineItems.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h5 className="text-sm font-medium text-gray-900 mb-3">Delivery Breakdown</h5>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {invoiceLineItems.map((item) => (
                              <div key={item.id} className="flex items-center justify-between text-sm py-2 px-3 bg-gray-50 rounded">
                                <div>
                                  <span className="text-gray-900">
                                    {new Date(item.deliveryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                  <span className="text-gray-500 ml-2">{item.quantity}L</span>
                                </div>
                                <span className="font-medium text-gray-900">₹{item.amount.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerPortal;
