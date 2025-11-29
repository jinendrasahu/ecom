import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Package, DollarSign, Tag, TrendingDown } from 'lucide-react';
import { adminApi } from '../api/admin';
import { ProductGridSkeleton } from '../components/SkeletonLoader';

const AdminStatistics = () => {
  const { data: statistics, isLoading } = useQuery({
    queryKey: ['admin-statistics'],
    queryFn: adminApi.getStatistics,
  });

  if (isLoading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Statistics</h1>
        <ProductGridSkeleton count={4} />
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Items Purchased',
      value: statistics?.totalItemsPurchased || 0,
      icon: Package,
      color: 'bg-blue-500',
    },
    {
      title: 'Total Purchase Amount',
      value: `$${Number(statistics?.totalPurchaseAmount || 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      title: 'Total Discount Amount',
      value: `$${Number(statistics?.totalDiscountAmount || 0).toFixed(2)}`,
      icon: TrendingDown,
      color: 'bg-purple-500',
    },
    {
      title: 'Active Discounts',
      value: statistics?.discounts?.filter((d) => d.isActive).length || 0,
      icon: Tag,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="w-full">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">Admin Statistics</h1>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-md p-4 sm:p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">{stat.title}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-2 sm:p-3 rounded-full flex-shrink-0 ml-2`}>
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Discounts List */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Recent Discounts</h2>
        <div className="space-y-2 overflow-x-auto">
          {statistics?.discounts && statistics.discounts.length > 0 ? (
            statistics.discounts.slice(0, 10).map((discount) => (
              <div
                key={discount.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg gap-2 sm:gap-0"
              >
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <span className="font-semibold text-gray-900 text-sm sm:text-base truncate">{discount.name}</span>
                  <span className="text-xs sm:text-sm text-gray-600">({discount.code})</span>
                  <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800 whitespace-nowrap">
                    {discount.type === 'percentage' ? `${discount.value}%` : `$${discount.value}`}
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs whitespace-nowrap ${
                      discount.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {discount.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                  {new Date(discount.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm sm:text-base">No discounts found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminStatistics;

