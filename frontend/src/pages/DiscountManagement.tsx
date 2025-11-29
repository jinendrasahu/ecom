import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, CheckCircle, XCircle, Tag } from 'lucide-react';
import { adminApi, Discount, CreateDiscountDto } from '../api/admin';
import toast from 'react-hot-toast';
import { DiscountListSkeleton } from '../components/SkeletonLoader';

const DiscountManagement = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [formData, setFormData] = useState<CreateDiscountDto>({
    name: '',
    description: '',
    code: '',
    type: 'percentage',
    value: 0,
    conditionType: undefined,
    conditionValue: undefined,
    expiresAt: undefined,
    isActive: true,
    isGlobal: false,
    isListedToUser: false,
  });

  // Client-side pagination with infinite scroll (backend doesn't have pagination yet)
  const { data: allDiscounts = [], isLoading } = useQuery({
    queryKey: ['discounts'],
    queryFn: adminApi.getDiscounts,
  });

  const itemsPerPage = 12;
  const [displayedCount, setDisplayedCount] = useState(itemsPerPage);
  const discounts = allDiscounts.slice(0, displayedCount);
  const hasMore = displayedCount < allDiscounts.length;

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
    
    if (isNearBottom && hasMore && !isLoading) {
      setDisplayedCount((prev) => Math.min(prev + itemsPerPage, allDiscounts.length));
    }
  }, [hasMore, isLoading, allDiscounts.length, itemsPerPage]);

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

  const createMutation = useMutation({
    mutationFn: adminApi.createDiscount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-statistics'] });
      toast.success('Discount created!');
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create discount');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateDiscountDto> }) =>
      adminApi.updateDiscount(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-statistics'] });
      toast.success('Discount updated!');
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update discount');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteDiscount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-statistics'] });
      toast.success('Discount deleted!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete discount');
    },
  });

  const evaluateMutation = useMutation({
    mutationFn: adminApi.evaluateDiscount,
    onSuccess: () => {
      toast.success('Discount evaluated and assigned to eligible users!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to evaluate discount');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      code: '',
      type: 'percentage',
      value: 0,
      conditionType: undefined,
      conditionValue: undefined,
      expiresAt: undefined,
      isActive: true,
      isGlobal: false,
      isListedToUser: false,
    });
    setEditingDiscount(null);
    setIsModalOpen(false);
  };

  const handleEdit = (discount: Discount) => {
    setEditingDiscount(discount);
    setFormData({
      name: discount.name,
      description: discount.description || '',
      code: discount.code,
      type: discount.type,
      value: discount.value,
      conditionType: discount.conditionType || undefined,
      conditionValue: discount.conditionValue || undefined,
      expiresAt: discount.expiresAt || undefined,
      isActive: discount.isActive,
      isGlobal: discount.isGlobal,
      isListedToUser: discount.isListedToUser,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.conditionType && !formData.isGlobal) {
      if (formData.conditionType === 'order_count' && !formData.conditionValue?.orderCount) {
        toast.error('Please specify order count');
        return;
      }
      if (
        formData.conditionType === 'minimum_spend' &&
        !formData.conditionValue?.minimumSpend
      ) {
        toast.error('Please specify minimum spend amount');
        return;
      }
    }

    if (editingDiscount) {
      updateMutation.mutate({ id: editingDiscount.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this discount?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEvaluate = (id: string) => {
    evaluateMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Discount Management</h1>
        <DiscountListSkeleton count={6} />
      </div>
    );
  }

  return (
    <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Discount Management</h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Create Discount</span>
        </motion.button>
      </div>

      {discounts.length === 0 ? (
        <div className="text-center py-12">
          <Tag className="h-24 w-24 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No discounts found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6">
            {discounts.map((discount, index) => (
              <motion.div
                key={discount.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{discount.name}</h3>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          discount.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {discount.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          discount.isGlobal
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {discount.isGlobal ? 'Global' : 'Conditional'}
                      </span>
                      {discount.isListedToUser && (
                        <span className="px-2 py-1 rounded text-xs bg-pink-100 text-pink-700">
                          Listed to User
                        </span>
                      )}
                    </div>
                    {discount.description && (
                      <p className="text-sm text-gray-600 mb-2">{discount.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-gray-500">Code:</span>
                      <span className="font-mono font-semibold text-gray-900">{discount.code}</span>
                      <span className="text-gray-500">Type:</span>
                      <span className="font-semibold text-gray-900">
                        {discount.type === 'percentage' ? `${discount.value}%` : `$${discount.value}`}
                      </span>
                      {discount.conditionType && (
                        <>
                          <span className="text-gray-500">Condition:</span>
                          <span className="font-semibold text-gray-900">
                            {discount.conditionType === 'order_count' &&
                              `Order Count: ${discount.conditionValue?.orderCount || 'N/A'}`}
                            {discount.conditionType === 'minimum_spend' &&
                              `Min Spend: $${discount.conditionValue?.minimumSpend || 'N/A'}`}
                            {discount.conditionType === 'first_order' && 'First Order'}
                          </span>
                        </>
                      )}
                      {discount.expiresAt && (
                        <>
                          <span className="text-gray-500">Expires:</span>
                          <span className="font-semibold text-gray-900">
                            {new Date(discount.expiresAt).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!discount.isGlobal && discount.conditionType && (
                      <button
                        onClick={() => handleEvaluate(discount.id)}
                        className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100"
                        title="Evaluate and assign to eligible users"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(discount)}
                      className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(discount.id)}
                      className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          {hasMore && (
            <div className="mt-8">
              <DiscountListSkeleton count={4} />
            </div>
          )}
          {!hasMore && discounts.length > 0 && (
            <div className="text-center py-8 text-gray-500">
              All discounts loaded
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {editingDiscount ? 'Edit Discount' : 'Create Discount'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as 'percentage' | 'fixed',
                      })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Value *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={formData.type === 'percentage' ? '100' : undefined}
                    value={formData.value}
                    onChange={(e) =>
                      setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Is Global
                  </label>
                  <select
                    value={formData.isGlobal ? 'true' : 'false'}
                    onChange={(e) =>
                      setFormData({ ...formData, isGlobal: e.target.value === 'true' })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="false">Conditional (User-specific)</option>
                    <option value="true">Global (All users)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.isActive ? 'true' : 'false'}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.value === 'true' })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Listed to User
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      isListedToUser: !prev.isListedToUser,
                    }))
                  }
                  className={`w-full flex items-center justify-between px-4 py-2 rounded-lg border ${
                    formData.isListedToUser
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-gray-300 bg-gray-50 text-gray-600'
                  }`}
                >
                  <span>{formData.isListedToUser ? 'Visible in checkout' : 'Hidden from checkout'}</span>
                  <span
                    className={`inline-flex h-6 w-10 items-center rounded-full transition ${
                      formData.isListedToUser ? 'bg-pink-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`h-5 w-5 transform rounded-full bg-white shadow transition ${
                        formData.isListedToUser ? 'translate-x-4' : 'translate-x-1'
                      }`}
                    />
                  </span>
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  Enable this to highlight the discount on the checkout page.
                </p>
              </div>

              {!formData.isGlobal && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Condition Type
                    </label>
                    <select
                      value={formData.conditionType || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          conditionType:
                            e.target.value === '' ? undefined : (e.target.value as any),
                          conditionValue: undefined,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">No Condition</option>
                      <option value="order_count">Order Count</option>
                      <option value="minimum_spend">Minimum Spend</option>
                      <option value="first_order">First Order</option>
                    </select>
                  </div>

                  {formData.conditionType === 'order_count' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Minimum Order Count *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.conditionValue?.orderCount || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            conditionValue: { orderCount: parseInt(e.target.value) || 0 },
                          })
                        }
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  )}

                  {formData.conditionType === 'minimum_spend' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Minimum Spend Amount ($) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.conditionValue?.minimumSpend || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            conditionValue: { minimumSpend: parseFloat(e.target.value) || 0 },
                          })
                        }
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiration Date
                </label>
                <input
                  type="datetime-local"
                  value={
                    formData.expiresAt
                      ? new Date(formData.expiresAt).toISOString().slice(0, 16)
                      : ''
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expiresAt: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {createMutation.isLoading || updateMutation.isLoading
                    ? 'Saving...'
                    : editingDiscount
                      ? 'Update'
                      : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DiscountManagement;
