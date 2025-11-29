import { useState, useEffect, useCallback } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { productApi, PaginatedProducts } from '../api/products';
import { categoryApi } from '../api/categories';
import { uploadClient } from '../api/client';
import toast from 'react-hot-toast';
import { ProductGridSkeleton } from '../components/SkeletonLoader';

const ProductManagement = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    categoryId: '',
    image: null as File | null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const queryClient = useQueryClient();

  // Infinite query for products
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['products-admin'],
    queryFn: ({ pageParam = 1 }) => productApi.getAllAdmin(pageParam as number, 12),
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Flatten products from all pages
  const products = data?.pages.flatMap((page: PaginatedProducts) => page.products) || [];

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

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await uploadClient.post('/products', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-admin'] });
      toast.success('Product created!');
      resetForm();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message;
      if (Array.isArray(errorMessage)) {
        const fieldErrors: Record<string, string> = {};
        errorMessage.forEach((msg: string) => {
          if (msg.includes('name')) fieldErrors.name = msg;
          else if (msg.includes('description')) fieldErrors.description = msg;
          else if (msg.includes('price')) fieldErrors.price = msg;
          else if (msg.includes('stock')) fieldErrors.stock = msg;
          else if (msg.includes('category')) fieldErrors.categoryId = msg;
        });
        setErrors(fieldErrors);
      } else {
        toast.error(errorMessage || 'Failed to create product');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData }) => {
      const response = await uploadClient.put(`/products/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-admin'] });
      toast.success('Product updated!');
      resetForm();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message;
      if (Array.isArray(errorMessage)) {
        const fieldErrors: Record<string, string> = {};
        errorMessage.forEach((msg: string) => {
          if (msg.includes('name')) fieldErrors.name = msg;
          else if (msg.includes('description')) fieldErrors.description = msg;
          else if (msg.includes('price')) fieldErrors.price = msg;
          else if (msg.includes('stock')) fieldErrors.stock = msg;
          else if (msg.includes('category')) fieldErrors.categoryId = msg;
        });
        setErrors(fieldErrors);
      } else {
        toast.error(errorMessage || 'Failed to update product');
      }
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      return await productApi.deactivate(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-admin'] });
      toast.success('Product deactivated!');
    },
  });

  const activateMutation = useMutation({
    mutationFn: async (id: string) => {
      return await productApi.activate(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-admin'] });
      toast.success('Product activated!');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      stock: '',
      categoryId: '',
      image: null,
    });
    setErrors({});
    setEditingProduct(null);
    setIsModalOpen(false);
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock.toString(),
      categoryId: product.categoryId || product.category?.id || '',
      image: null,
    });
    setIsModalOpen(true);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 255) {
      newErrors.name = 'Name must be less than 255 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length > 2000) {
      newErrors.description = 'Description must be less than 2000 characters';
    }

    const price = parseFloat(formData.price);
    if (!formData.price || isNaN(price)) {
      newErrors.price = 'Price is required and must be a valid number';
    } else if (price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    } else if (price > 999999.99) {
      newErrors.price = 'Price must be less than 1,000,000';
    }

    const stock = parseInt(formData.stock);
    if (!formData.stock || isNaN(stock)) {
      newErrors.stock = 'Stock is required and must be a valid number';
    } else if (stock < 0) {
      newErrors.stock = 'Stock cannot be negative';
    }

    if (formData.categoryId && formData.categoryId !== '') {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(formData.categoryId)) {
        newErrors.categoryId = 'Invalid category selected';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setErrors({});

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name.trim());
    formDataToSend.append('description', formData.description.trim());
    formDataToSend.append('price', formData.price);
    formDataToSend.append('stock', formData.stock);
    if (formData.categoryId && formData.categoryId !== '') {
      formDataToSend.append('categoryId', formData.categoryId);
    } else {
      formDataToSend.append('categoryId', '');
    }
    if (formData.image) {
      formDataToSend.append('image', formData.image);
    }

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: formDataToSend });
    } else {
      createMutation.mutate(formDataToSend);
    }
  };

  return (
    <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Product Management</h1>
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
          <span>Add Product</span>
        </motion.button>
      </div>

      {isLoading ? (
        <ProductGridSkeleton count={9} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="relative h-48 bg-gray-100">
                  {product.imageUrl ? (
                    <img
                      src={`http://localhost:3001${product.imageUrl}`}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-gray-400">No Image</span>
                    </div>
                  )}
                  {!product.isActive && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                      Inactive
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-gray-900">
                      ${Number(product.price).toFixed(2)}
                    </span>
                    <div className="flex flex-col items-end">
                      <span className="text-sm text-gray-500">Stock: {product.stock}</span>
                      {product.category && (
                        <span className="text-xs text-blue-600">{product.category.name}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 flex items-center justify-center space-x-1"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit</span>
                    </button>
                    {product.isActive ? (
                      <button
                        onClick={() => deactivateMutation.mutate(product.id)}
                        className="bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100"
                      >
                        <EyeOff className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => activateMutation.mutate(product.id)}
                        className="bg-green-50 text-green-600 px-3 py-2 rounded-lg hover:bg-green-100"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          {isFetchingNextPage && (
            <div className="mt-8">
              <ProductGridSkeleton count={6} />
            </div>
          )}
          {!hasNextPage && products.length > 0 && (
            <div className="text-center py-8 text-gray-500">
              All products loaded
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
            className="bg-white rounded-lg p-6 w-full max-w-md"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: '' });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                    if (errors.description) setErrors({ ...errors, description: '' });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  rows={3}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="999999.99"
                    value={formData.price}
                    onChange={(e) => {
                      setFormData({ ...formData, price: e.target.value });
                      if (errors.price) setErrors({ ...errors, price: '' });
                    }}
                    className={`w-full px-4 py-2 border rounded-lg ${
                      errors.price ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-600">{errors.price}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => {
                      setFormData({ ...formData, stock: e.target.value });
                      if (errors.stock) setErrors({ ...errors, stock: '' });
                    }}
                    className={`w-full px-4 py-2 border rounded-lg ${
                      errors.stock ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.stock && (
                    <p className="mt-1 text-sm text-red-600">{errors.stock}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => {
                    setFormData({ ...formData, categoryId: e.target.value });
                    if (errors.categoryId) setErrors({ ...errors, categoryId: '' });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg ${
                    errors.categoryId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a category (optional)</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      image: e.target.files?.[0] || null,
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
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  {editingProduct ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
