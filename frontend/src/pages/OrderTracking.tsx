import { useEffect, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Package, Truck, CheckCircle, Clock, XCircle } from 'lucide-react';
import { orderApi, PaginatedOrders } from '../api/orders';
import { useAuth } from '../context/AuthContext';
import { OrderListSkeleton } from '../components/SkeletonLoader';

const OrderTracking = () => {
  const { user } = useAuth();
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ['orders', user?.id],
    queryFn: ({ pageParam = 1 }) => orderApi.getUserOrders(pageParam as number, 10),
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled: !!user?.id,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  // Flatten orders from all pages
  const orders = data?.pages.flatMap((page: PaginatedOrders) => page.orders) || [];

  // Infinite scroll handler - listens to the scrollable main container
  const handleScroll = useCallback((e: Event) => {
    const target = e.target as HTMLElement;
    if (!target) return;

    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;
    
    // Trigger when user is within 500px of the bottom
    const threshold = 500;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - threshold;
    
    if (isNearBottom && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    // Find the scrollable main container (from Layout component)
    const mainContainer = document.querySelector('main.overflow-y-auto') as HTMLElement;
    if (!mainContainer) return;

    let ticking = false;
    let lastScrollTop = mainContainer.scrollTop;
    
    const throttledScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      const currentScrollTop = target.scrollTop;
      
      // Only trigger if user scrolled down (not up or initial load)
      if (currentScrollTop <= lastScrollTop) {
        lastScrollTop = currentScrollTop;
        return;
      }
      lastScrollTop = currentScrollTop;
      
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll(e);
          ticking = false;
        });
        ticking = true;
      }
    };
    
    mainContainer.addEventListener('scroll', throttledScroll, { passive: true });
    
    return () => {
      mainContainer.removeEventListener('scroll', throttledScroll);
    };
  }, [handleScroll]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'processing':
        return <Package className="h-5 w-5 text-purple-500" />;
      case 'shipped':
        return <Truck className="h-5 w-5 text-indigo-500" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Order Tracking</h1>
        <OrderListSkeleton count={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Order Tracking</h1>
        <div className="text-center py-12">
          <Package className="h-24 w-24 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            {error instanceof Error ? error.message : 'Failed to load orders'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Order Tracking</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-24 w-24 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No orders found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Order #{order.id?.slice(0, 8).toUpperCase() || 'N/A'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Placed on {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(order.status || 'pending')}
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                      order.status || 'pending',
                    )}`}
                  >
                    {(order.status || 'pending').charAt(0).toUpperCase() + (order.status || 'pending').slice(1)}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4 mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Subtotal:</span>
                    <span className="ml-2 font-semibold">
                      ${Number(order.subtotal || 0).toFixed(2)}
                    </span>
                  </div>
                  {Number(order.discountAmount || 0) > 0 && (
                    <div>
                      <span className="text-gray-500">Discount:</span>
                      <span className="ml-2 font-semibold text-green-600">
                        -${Number(order.discountAmount || 0).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="col-span-2">
                    <span className="text-gray-500">Total:</span>
                    <span className="ml-2 font-semibold text-lg">
                      ${Number(order.total || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {order.trackingNumber && (
                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Tracking Number:</span>{' '}
                    {order.trackingNumber}
                  </p>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-2">Order Items</h4>
                <div className="space-y-2">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center space-x-3">
                          {item.product?.imageUrl ? (
                            <img
                              src={`http://localhost:3001${item.product.imageUrl}`}
                              alt={item.product.name || 'Product'}
                              className="w-12 h-12 object-cover rounded"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"%3E%3Cpath fill="%23ccc" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/%3E%3C/svg%3E';
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">
                              {item.product?.name || 'Unknown Product'}
                            </p>
                            <p className="text-gray-500">Qty: {item.quantity || 0}</p>
                          </div>
                        </div>
                        <p className="font-semibold text-gray-900">
                          ${Number(item.price || 0).toFixed(2)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No items found</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      {isFetchingNextPage && (
        <div className="mt-6">
          <OrderListSkeleton count={3} />
        </div>
      )}
      {!hasNextPage && orders.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          All orders loaded
        </div>
      )}
    </div>
  );
};

export default OrderTracking;

