import { useState, useEffect, useCallback } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { TrendingUp, Heart } from 'lucide-react';
import { productApi, Product, PaginatedProducts } from '../api/products';
import { categoryApi } from '../api/categories';
import { cartApi } from '../api/cart';
import { favoriteApi } from '../api/favorites';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import ProductCard from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/SkeletonLoader';

const PopularProducts = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  // Get categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryApi.getAll,
  });

  // Get favorite product IDs
  const { data: favoriteProductIds = [] } = useQuery({
    queryKey: ['favorite-ids'],
    queryFn: favoriteApi.getFavoriteProductIds,
    enabled: !!user,
  });

  useEffect(() => {
    if (favoriteProductIds && Array.isArray(favoriteProductIds)) {
      setFavoriteIds(favoriteProductIds);
    }
  }, [favoriteProductIds?.join(',')]);

  // Infinite query for products
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['products', 'popular', showFavoritesOnly, selectedCategoryId],
    queryFn: ({ pageParam = 1 }) => productApi.getAll(pageParam as number, 12),
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

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async (productId: string) => {
      const isFavorite = favoriteIds.includes(productId);
      if (isFavorite) {
        await favoriteApi.removeFromFavorites(productId);
      } else {
        await favoriteApi.addToFavorites(productId);
      }
      return !isFavorite;
    },
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: ['favorite-ids'] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      const newFavorites = favoriteIds.includes(productId)
        ? favoriteIds.filter((id) => id !== productId)
        : [...favoriteIds, productId];
      setFavoriteIds(newFavorites);
    },
    onError: () => {
      toast.error('Failed to update favorites');
    },
  });

  // Flatten products from all pages
  const allProducts = data?.pages.flatMap((page: PaginatedProducts) => page.products) || [];
  
  // Filter products by category
  let filteredProducts = allProducts;
  if (selectedCategoryId) {
    filteredProducts = filteredProducts.filter((p) => 
      p.categoryId === selectedCategoryId || p.category?.id === selectedCategoryId
    );
  }
  
  // Filter products based on favorites filter
  if (showFavoritesOnly) {
    filteredProducts = filteredProducts.filter((p) => favoriteIds.includes(p.id));
  }

  // Sort by price (popular = higher price)
  const popularProducts = [...filteredProducts]
    .sort((a, b) => Number(b.price) - Number(a.price));

  const handleAddToCart = async (productId: string) => {
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

  const handleToggleFavorite = (productId: string) => {
    if (!isAuthenticated) {
      toast.error('Please login to add favorites');
      return;
    }
    toggleFavoriteMutation.mutate(productId);
  };

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
    
    const throttledScroll = (e: Event) => {
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

  if (isLoading) {
    return (
      <div>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-3 mb-6"
        >
          <TrendingUp className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Popular Products</h1>
        </motion.div>
        <ProductGridSkeleton count={8} />
      </div>
    );
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4"
      >
        <div className="flex items-center space-x-3">
          <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Popular Products</h1>
        </div>
        {isAuthenticated && (
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              showFavoritesOnly
                ? 'bg-red-100 text-red-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Heart className={`h-5 w-5 ${showFavoritesOnly ? 'fill-current' : ''}`} />
            <span>{showFavoritesOnly ? 'Show All' : 'Show Favorites'}</span>
          </button>
        )}
      </motion.div>

      <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-8">
        Discover our most loved products, handpicked by our customers
      </p>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap gap-2 sm:gap-4 mb-4 sm:mb-8">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setSelectedCategoryId(null)}
          className={`px-6 py-2 rounded-full font-medium transition-colors ${
            selectedCategoryId === null
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </motion.button>
        {categories.map((category) => (
          <motion.button
            key={category.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedCategoryId(category.id)}
            className={`px-6 py-2 rounded-full font-medium transition-colors ${
              selectedCategoryId === category.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category.name}
          </motion.button>
        ))}
      </div>

      {popularProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {showFavoritesOnly ? 'No favorite products yet' : 'No products available'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {popularProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                isFavorite={favoriteIds.includes(product.id)}
                onToggleFavorite={handleToggleFavorite}
                index={index}
              />
            ))}
          </div>
          {isFetchingNextPage && (
            <div className="mt-8">
              <ProductGridSkeleton count={4} />
            </div>
          )}
          {!hasNextPage && popularProducts.length > 0 && (
            <div className="text-center py-8 text-gray-500">
              All products loaded
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PopularProducts;
