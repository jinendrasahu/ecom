import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart, Filter } from 'lucide-react';
import { productApi } from '../api/products';
import { cartApi } from '../api/cart';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { useState } from 'react';

const ClothingAndShoes = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: productApi.getAll,
  });

  const handleAddToCart = async (productId: number) => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return;
    }
    try {
      await cartApi.addToCart(productId, 1);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Added to cart!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Filter products for clothing and shoes
  const filteredProducts = products.filter(
    (p) => p.category === 'clothing' || p.category === 'shoes' || selectedCategory === 'all'
  );

  const categories = [
    { id: 'all', name: 'All Items' },
    { id: 'clothing', name: 'Clothing' },
    { id: 'shoes', name: 'Shoes' },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Clothing & Shoes
      </h1>

      {/* Category Filters */}
      <div className="flex items-center space-x-4 mb-8">
        <Filter className="h-5 w-5 text-gray-600" />
        {categories.map((cat) => (
          <motion.button
            key={cat.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-6 py-2 rounded-full font-medium transition-colors ${
              selectedCategory === cat.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cat.name}
          </motion.button>
        ))}
      </div>

      {/* Featured Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-8 text-white"
        >
          <h2 className="text-2xl font-bold mb-2">New Arrivals</h2>
          <p className="mb-4 opacity-90">Fresh styles just dropped</p>
          <button className="bg-white text-indigo-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100">
            Shop Now
          </button>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl p-8 text-white"
        >
          <h2 className="text-2xl font-bold mb-2">Season Sale</h2>
          <p className="mb-4 opacity-90">Up to 40% off selected items</p>
          <button className="bg-white text-orange-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100">
            View Deals
          </button>
        </motion.div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProducts.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow"
          >
            <div className="relative h-64 bg-gray-100">
              {product.imageUrl ? (
                <img
                  src={`http://localhost:3001${product.imageUrl}`}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingCart className="h-16 w-16 text-gray-300" />
                </div>
              )}
              <button className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:bg-white">
                <Heart className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            <div className="p-4">
              <span className="text-xs font-semibold text-blue-600 uppercase">
                {product.category}
              </span>
              <h3 className="font-semibold text-gray-900 mt-1 mb-2 line-clamp-2">
                {product.name}
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900">
                  ${Number(product.price).toFixed(2)}
                </span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAddToCart(product.id)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-blue-700"
                >
                  Add
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No products found in this category</p>
        </div>
      )}
    </div>
  );
};

export default ClothingAndShoes;

