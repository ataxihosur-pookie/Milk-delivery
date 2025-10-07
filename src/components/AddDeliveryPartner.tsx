import React, { useState } from 'react';
import { X, Eye, EyeOff, RefreshCw, Truck } from 'lucide-react';
import { useData } from '../context/DataContext';
import { supabase, testConnection } from '../lib/supabase';

interface AddDeliveryPartnerProps {
  supplierId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const AddDeliveryPartner: React.FC<AddDeliveryPartnerProps> = ({ supplierId, onClose, onSuccess }) => {
  const { addDeliveryPartner } = useData();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    vehicleNumber: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Generate random password
  const generatePassword = () => {
    const password = Math.random().toString(36).substr(2, 8);
    setFormData(prev => ({ ...prev, password }));
  };

  // Generate password on component mount
  React.useEffect(() => {
    generatePassword();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Use the addDeliveryPartner function from DataContext
      await addDeliveryPartner({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        supplierId: supplierId,
        vehicleNumber: formData.vehicleNumber.trim().toUpperCase(),
        password: formData.password,
        status: 'active'
      });

      alert(`Delivery partner "${formData.name}" added successfully!\n\nLogin credentials:\nEmail: ${formData.email}\nPassword: ${formData.password}\n\nThey can now login using these credentials.`);

      // Notify parent and close
      onSuccess();
      onClose();

    } catch (error: any) {
      console.error('Error adding delivery partner:', error);
      setError(error.message || 'Failed to add delivery partner. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Truck className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Add Delivery Partner</h3>
              <p className="text-sm text-gray-500">Register a new delivery partner</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <React.Fragment>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter partner's full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter email address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle Number *
            </label>
            <input
              type="text"
              name="vehicleNumber"
              required
              value={formData.vehicleNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter vehicle registration number"
            />
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-blue-900">Login Credentials</h4>
              <button
                type="button"
                onClick={generatePassword}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Generate New</span>
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  Username (Email)
                </label>
                <div className="w-full px-3 py-2 text-sm border border-blue-200 rounded-md bg-blue-50 font-mono text-blue-900">
                  {formData.email || 'Enter email above'}
                </div>
              </div>
              
              <div className="relative">
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className={`w-full px-3 py-2 pr-10 text-sm border border-blue-200 rounded-md bg-blue-50 font-mono text-blue-900 ${
                    showPassword ? '' : 'tracking-widest'
                  }`}>
                    {showPassword ? formData.password : '•'.repeat(formData.password.length)}
                  </div>
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-blue-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-blue-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="text-xs text-blue-600 bg-blue-100 p-3 rounded mt-4">
              <div className="font-semibold mb-2">📝 Login Instructions:</div>
              <div className="space-y-1">
                <div><strong>Username:</strong> {formData.email || 'Will be the email entered above'}</div>
                <div><strong>Password:</strong> {showPassword ? formData.password : '•'.repeat(formData.password.length)}</div>
              </div>
              <div className="mt-2 text-blue-700">
                The delivery partner will use these credentials to login to the system.
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <div className="flex items-start">
              <div className="text-yellow-600 mr-2 mt-0.5">⚠️</div>
              <div className="text-sm text-yellow-800">
                <strong>Important:</strong> Make sure to share these credentials securely with the delivery partner. They will need both the username (email) and password to access their dashboard.
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              <div className="flex items-center">
                <div className="text-red-500 mr-2">⚠️</div>
                <div>
                  <strong>Error:</strong> {error}
                </div>
              </div>
            </div>
          )}

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.name || !formData.email || !formData.phone || !formData.vehicleNumber}
              className="flex-1 py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding Partner...
                </span>
              ) : (
                'Add Delivery Partner'
              )}
            </button>
          </div>
          </React.Fragment>
        </form>
      </div>
    </div>
  );
};

export default AddDeliveryPartner;