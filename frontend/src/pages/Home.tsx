import { useState, useEffect, useCallback } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { productApi, PaginatedProducts } from '../api/products';
import { cartApi } from '../api/cart';
import { favoriteApi } from '../api/favorites';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import ProductCard from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/SkeletonLoader';

const Home = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

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
    queryKey: ['products', 'home', showFavoritesOnly],
    queryFn: ({ pageParam = 1 }: { pageParam?: number }) => productApi.getAll(pageParam || 1, 12),
    getNextPageParam: (lastPage: PaginatedProducts) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
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
  
  // Filter products based on favorites filter
  const filteredProducts = showFavoritesOnly
    ? allProducts.filter((p) => favoriteIds.includes(p.id))
    : allProducts;

  const handleAddToCart = async (productId: string) => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      navigate('/login');
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

  // Infinite scroll handler - works for both window scroll (public page) and main container (dashboard)
  const handleScroll = useCallback((e: Event) => {
    const target = e.target as HTMLElement;
    if (!target) return;

    // Handle both window scroll and container scroll
    const scrollTop = target === document.documentElement 
      ? window.pageYOffset || document.documentElement.scrollTop
      : target.scrollTop;
    const scrollHeight = target === document.documentElement
      ? document.documentElement.scrollHeight
      : target.scrollHeight;
    const clientHeight = target === document.documentElement
      ? window.innerHeight
      : target.clientHeight;
    
    // Trigger when user is within 500px of the bottom
    const threshold = 500;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - threshold;
    
    if (isNearBottom && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
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
    
    // Try to find the scrollable main container first (for dashboard pages)
    const mainContainer = document.querySelector('main.overflow-y-auto') as HTMLElement;
    
    if (mainContainer) {
      // Dashboard page - listen to main container scroll
      mainContainer.addEventListener('scroll', throttledScroll, { passive: true });
      return () => {
        mainContainer.removeEventListener('scroll', throttledScroll);
      };
    } else {
      // Public page - listen to window scroll
      window.addEventListener('scroll', throttledScroll, { passive: true });
      window.addEventListener('resize', throttledScroll, { passive: true });
      return () => {
        window.removeEventListener('scroll', throttledScroll);
        window.removeEventListener('resize', throttledScroll);
      };
    }
  }, [handleScroll]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Explore</h1>
        <ProductGridSkeleton count={8} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Explore</h1>
        <div className="flex items-center gap-3">
          {!isAuthenticated && (
            <button
              onClick={() => navigate('/login')}
              className="bg-pink-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-pink-600 transition-colors"
            >
              Login
            </button>
          )}
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
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {showFavoritesOnly ? 'No favorite products yet' : 'No products available'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product, index) => (
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
        </>
      )}

    
    </div>
  );
};

export default Home;
