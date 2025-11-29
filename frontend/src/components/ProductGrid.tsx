import { Product } from '../api/products';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: Product[];
  onAddToCart: (productId: string) => void;
  columns?: 2 | 3 | 4;
}

const ProductGrid = ({ products, onAddToCart, columns = 4 }: ProductGridProps) => {
  const gridClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  }[columns];

  return (
    <div className={`grid ${gridClass} gap-6`}>
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          index={index}
        />
      ))}
    </div>
  );
};

export default ProductGrid;

