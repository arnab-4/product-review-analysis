import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Star, BarChart3 } from "lucide-react";
import { useState } from "react";
import { useProduct } from "@/hooks/useProducts";
import { useReviews, Review } from "@/hooks/useReviews";
import { Button } from "@/components/ui/button";
import RatingDisplay from "@/components/RatingDisplay";
import ReviewForm from "@/components/ReviewForm";
import SentimentChart from "@/components/SentimentChart";
import ProductInsights from "@/components/ProductInsights";
import ReviewAnalysisModal from "@/components/ReviewAnalysisModal";
import ProductReviewChatbot from "@/components/ProductReviewChatbot";

const ProductDetails = () => {
  const { id } = useParams();
  const { data: product, isLoading: productLoading, error: productError } = useProduct(id!);
  const { data: reviews, isLoading: reviewsLoading } = useReviews(id!);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewAnalysis = (review: Review) => {
    setSelectedReview(review);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedReview(null);
  };

  if (productLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Product Not Found</h1>
          <Link to="/" className="text-blue-600 hover:text-blue-700">
            Return to Products
          </Link>
        </div>
      </div>
    );
  }

  const positivePercentage = product.total_reviews > 0 
    ? Math.round((product.good_reviews / product.total_reviews) * 100) 
    : 0;

  // Calculate neutral reviews count from actual reviews data
  const neutralReviewsCount = reviews?.filter(review => review.sentiment === 'neutral').length || 0;

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={20}
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

  const starCounts = {
    1: product.star_1_count || 0,
    2: product.star_2_count || 0,
    3: product.star_3_count || 0,
    4: product.star_4_count || 0,
    5: product.star_5_count || 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors">
            <ArrowLeft size={20} />
            Back to Products
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Image */}
          <div className="aspect-square bg-white rounded-2xl overflow-hidden shadow-lg">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-3">
                {product.name}
              </h1>
              <p className="text-slate-600 text-lg">
                {product.description}
              </p>
            </div>

            <div className="text-4xl font-bold text-slate-800">
              ${product.price}
            </div>

            {/* Rating Overview */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1">
                  {renderStars(product.average_rating || 0)}
                </div>
                <span className="text-2xl font-bold text-slate-800">
                  {(product.average_rating || 0).toFixed(1)}
                </span>
                <span className="text-slate-600">
                  ({product.total_reviews || 0} reviews)
                </span>
              </div>

              {(product.total_reviews || 0) > 0 && (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {positivePercentage}%
                      </div>
                      <div className="text-sm text-green-700">Positive</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {100 - positivePercentage}%
                      </div>
                      <div className="text-sm text-red-700">Negative</div>
                    </div>
                  </div>

                  <RatingDisplay starCounts={starCounts} totalReviews={product.total_reviews || 0} />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Analysis Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Product Insights */}
          <div className="lg:col-span-2">
            <ProductInsights product={product} reviews={reviews} />
          </div>

          {/* Sentiment Chart */}
          {(product.total_reviews || 0) > 0 && (
            <div className="lg:col-span-1">
              <SentimentChart 
                goodReviews={product.good_reviews || 0} 
                badReviews={product.bad_reviews || 0}
                neutralReviews={neutralReviewsCount}
              />
            </div>
          )}
        </div>

        {/* Review Form and List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <ReviewForm productId={product.id} productName={product.name} />
            
            {/* Reviews List */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200/50">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Customer Reviews</h3>
              {reviewsLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-slate-600">Loading reviews...</p>
                </div>
              ) : reviews && reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-slate-100 pb-4 last:border-b-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1">
                          {renderStars(review.rating)}
                        </div>
                        <span className="text-sm text-slate-600">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {/* Review Summary */}
                      {review.review_summary && (
                        <div className="mb-2 p-2 bg-blue-50 rounded text-sm italic text-blue-800">
                          "{review.review_summary}"
                        </div>
                      )}
                      
                      <p className="text-slate-700 mb-3">
                        {review.review_text}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                            review.sentiment === 'positive' 
                              ? 'bg-green-100 text-green-800' 
                              : review.sentiment === 'negative'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {review.sentiment?.charAt(0).toUpperCase() + review.sentiment?.slice(1)} Sentiment
                          </span>
                          
                          {review.final_confidence && (
                            <span className="text-xs text-slate-600">
                              {(review.final_confidence * 100).toFixed(1)}% confidence
                            </span>
                          )}
                          
                          {review.has_rating_mismatch && (
                            <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-600 rounded">
                              ⚠️ Mismatch
                            </span>
                          )}
                        </div>
                        
                        {(review.analysis_details || review.final_confidence) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewAnalysis(review)}
                            className="text-xs"
                          >
                            <BarChart3 className="w-3 h-3 mr-1" />
                            View Analysis
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600 text-center py-8">
                  No reviews yet. Be the first to review this product!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Review Analysis Modal */}
      {selectedReview && (
        <ReviewAnalysisModal
          review={selectedReview}
          isOpen={isModalOpen}
          onClose={closeModal}
        />
      )}

      {/* Product Review Chatbot */}
      <ProductReviewChatbot 
        productId={product.id} 
        productName={product.name} 
      />
    </div>
  );
};

export default ProductDetails;