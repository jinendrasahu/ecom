import { motion } from 'framer-motion';
import { Heart, ShoppingCart } from 'lucide-react';
import { Product } from '../api/products';

interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: string) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (productId: string) => void;
  index?: number;
}

const ProductCard = ({ 
  product, 
  onAddToCart, 
  isFavorite = false,
  onToggleFavorite,
  index = 0 
}: ProductCardProps) => {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(product.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
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
        <button
          onClick={handleFavoriteClick}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          className={`absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors ${
            isFavorite ? 'text-red-500' : 'text-gray-600'
          }`}
        >
          <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
        {product.stock < 10 && product.stock > 0 && (
          <span className="absolute top-3 left-3 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
            Low Stock
          </span>
        )}
        {product.stock === 0 && (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
            Out of Stock
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="text-sm text-gray-500 mb-1">Our Picks</p>
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {product.name}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">
            ${Number(product.price).toFixed(2)}
          </span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onAddToCart(product.id)}
            disabled={product.stock === 0}
            className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Add
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;

