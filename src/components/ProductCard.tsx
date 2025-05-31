
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { Product } from "@/hooks/useProducts";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const positivePercentage = product.total_reviews > 0 
    ? Math.round((product.good_reviews / product.total_reviews) * 100) 
    : 0;

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={14}
        className={`${
          index < Math.floor(rating)
            ? "fill-yellow-400 text-yellow-400"
            : index < rating
            ? "fill-yellow-200 text-yellow-400"
            : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <Link to={`/product/${product.id}`} className="group">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all duration-300 group-hover:-translate-y-1">
        {/* Product Image */}
        <div className="aspect-square overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Product Info */}
        <div className="p-5">
          <h3 className="font-semibold text-slate-800 text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
          
          <p className="text-slate-600 text-sm mb-3 line-clamp-2">
            {product.description}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1">
              {renderStars(product.average_rating)}
            </div>
            <span className="text-sm font-medium text-slate-700">
              {product.average_rating.toFixed(1)}
            </span>
            <span className="text-sm text-slate-500">
              ({product.total_reviews})
            </span>
          </div>

          {/* Sentiment Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center text-xs text-slate-600 mb-1">
              <span>Positive Sentiment</span>
              <span>{positivePercentage}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${positivePercentage}%` }}
              />
            </div>
          </div>

          {/* Price and CTA */}
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-slate-800">
              ${product.price}
            </span>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium group-hover:shadow-lg transition-shadow">
              View Details
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
