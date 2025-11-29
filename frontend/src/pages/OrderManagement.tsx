import { useState, useEffect, useCallback } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Package, Truck, CheckCircle, Clock, XCircle, Edit } from 'lucide-react';
import { orderApi, PaginatedOrders } from '../api/orders';
import toast from 'react-hot-toast';
import { OrderListSkeleton } from '../components/SkeletonLoader';

const OrderManagement = () => {
  const queryClient = useQueryClient();
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [statusForm, setStatusForm] = useState({
    status: '',
    trackingNumber: '',
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['orders-admin'],
    queryFn: ({ pageParam = 1 }) => orderApi.getAllOrders(pageParam as number, 10),
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
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

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      orderApi.updateOrderStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders-admin'] });
      toast.success('Order status updated!');
      setEditingOrder(null);
      setStatusForm({ status: '', trackingNumber: '' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update order status');
    },
  });

  const handleEdit = (order: any) => {
    setEditingOrder(order);
    setStatusForm({
      status: order.status,
      trackingNumber: order.trackingNumber || '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingOrder) {
      updateStatusMutation.mutate({
        id: editingOrder.id,
        data: statusForm,
      });
    }
  };

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
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Order Management</h1>
        <OrderListSkeleton count={5} />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Order Management</h1>

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
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Order #{order.id?.slice(0, 8).toUpperCase() || 'N/A'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    User ID: {order.userId?.slice(0, 8) || 'N/A'}... | Placed on{' '}
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
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
                  <button
                    onClick={() => handleEdit(order)}
                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-500">Subtotal:</span>
                  <span className="ml-2 font-semibold">${Number(order.subtotal || 0).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Total:</span>
                  <span className="ml-2 font-semibold text-lg">
                    ${Number(order.total || 0).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Items:</span>
                  <span className="ml-2 font-semibold">{order.items?.length || 0}</span>
                </div>
              </div>

              {order.trackingNumber && (
                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Tracking:</span> {order.trackingNumber}
                  </p>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-2">Items</h4>
                <div className="space-y-2">
                  {order.items && order.items.length > 0 ? (
                    <>
                      {order.items.slice(0, 3).map((item: any) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-gray-700">{item.product?.name || 'Unknown Product'}</span>
                          <span className="text-gray-500">
                            Qty: {item.quantity || 0} × ${Number(item.price || 0).toFixed(2)}
                          </span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-sm text-gray-500">
                          +{order.items.length - 3} more items
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">No items found</p>
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

      {/* Status Update Modal */}
      {editingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Update Order Status
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={statusForm.status}
                  onChange={(e) =>
                    setStatusForm({ ...statusForm, status: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              {statusForm.status === 'shipped' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tracking Number
                  </label>
                  <input
                    type="text"
                    value={statusForm.trackingNumber}
                    onChange={(e) =>
                      setStatusForm({
                        ...statusForm,
                        trackingNumber: e.target.value,
                      })
                    }
                    placeholder="Enter tracking number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              )}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingOrder(null);
                    setStatusForm({ status: '', trackingNumber: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateStatusMutation.isLoading}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {updateStatusMutation.isLoading ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;

