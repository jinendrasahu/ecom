import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Package, DollarSign, Tag, TrendingUp, RefreshCw } from 'lucide-react';
import { adminApi } from '../api/admin';
import toast from 'react-hot-toast';
import { useState } from 'react';

const AdminDashboard = () => {
  const queryClient = useQueryClient();
  const [orderId, setOrderId] = useState('');

  const { data: statistics, isLoading } = useQuery({
    queryKey: ['admin-statistics'],
    queryFn: adminApi.getStatistics,
  });

  const generateDiscountMutation = useMutation({
    mutationFn: (id: string) => adminApi.generateDiscountCode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-statistics'] });
      toast.success('Discount code generated successfully!');
      setOrderId('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to generate discount code');
    },
  });

  const handleGenerateDiscount = () => {
    if (!orderId || orderId.trim() === '') {
      toast.error('Please enter a valid order ID');
      return;
    }
    generateDiscountMutation.mutate(orderId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Items Purchased</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {statistics?.totalItemsPurchased || 0}
                </p>
              </div>
              <Package className="h-12 w-12 text-pink-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Purchase Amount</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ${statistics?.totalPurchaseAmount.toFixed(2) || '0.00'}
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-green-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Discount Amount</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ${statistics?.totalDiscountAmount.toFixed(2) || '0.00'}
                </p>
              </div>
              <TrendingUp className="h-12 w-12 text-blue-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Discount Codes</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {statistics?.discountCodes.length || 0}
                </p>
              </div>
              <Tag className="h-12 w-12 text-purple-500" />
            </div>
          </motion.div>
        </div>

        {/* Generate Discount Code */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-lg shadow-md p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Generate Discount Code
          </h2>
          <div className="flex space-x-2">
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Enter Order ID (UUID)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGenerateDiscount}
              disabled={generateDiscountMutation.isLoading}
              className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Generate</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Discount Codes List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Discount Codes
          </h2>
          {statistics?.discountCodes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No discount codes yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Code
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Created At
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Used At
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {statistics?.discountCodes.map((code, index) => (
                    <motion.tr
                      key={code.code}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 font-mono text-pink-600">
                        {code.code}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            code.isUsed
                              ? 'bg-red-100 text-red-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {code.isUsed ? 'Used' : 'Available'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(code.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {code.usedAt
                          ? new Date(code.usedAt).toLocaleDateString()
                          : '-'}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;

