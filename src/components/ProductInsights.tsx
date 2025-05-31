
import { Brain, TrendingUp, Users, Star, AlertCircle } from "lucide-react";
import { Product } from "@/hooks/useProducts";
import { Review } from "@/hooks/useReviews";

interface ProductInsightsProps {
  product: Product;
  reviews?: Review[];
}

const ProductInsights = ({ product, reviews = [] }: ProductInsightsProps) => {
  const positivePercentage = product.total_reviews > 0 
    ? Math.round((product.good_reviews / product.total_reviews) * 100) 
    : 0;

  const sentimentDistribution = {
    positive: reviews.filter(r => r.sentiment === 'positive').length,
    negative: reviews.filter(r => r.sentiment === 'negative').length,
    neutral: reviews.filter(r => r.sentiment === 'neutral').length,
  };

  const getInsightLevel = (percentage: number) => {
    if (percentage >= 80) return { level: "Excellent", color: "text-green-600", bg: "bg-green-50" };
    if (percentage >= 60) return { level: "Good", color: "text-blue-600", bg: "bg-blue-50" };
    if (percentage >= 40) return { level: "Fair", color: "text-yellow-600", bg: "bg-yellow-50" };
    return { level: "Poor", color: "text-red-600", bg: "bg-red-50" };
  };

  const insight = getInsightLevel(positivePercentage);

  const averageRatingByStars = (stars: number) => {
    const count = product[`star_${stars}_count` as keyof Product] as number || 0;
    return product.total_reviews > 0 ? Math.round((count / product.total_reviews) * 100) : 0;
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200/50">
      <div className="flex items-center gap-2 mb-6">
        <Brain className="w-6 h-6 text-indigo-600" />
        <h3 className="text-xl font-bold text-slate-800">Product Insights</h3>
      </div>

      {/* Overall Sentiment Score */}
      <div className={`p-4 rounded-lg mb-6 ${insight.bg}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Overall Sentiment</span>
          <span className={`text-lg font-bold ${insight.color}`}>{insight.level}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white bg-opacity-50 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${positivePercentage}%` }}
            />
          </div>
          <span className="text-sm font-medium text-slate-600">{positivePercentage}%</span>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-slate-50 rounded-lg">
          <Users className="w-6 h-6 mx-auto mb-2 text-slate-600" />
          <div className="text-2xl font-bold text-slate-800">{product.total_reviews}</div>
          <div className="text-sm text-slate-600">Total Reviews</div>
        </div>
        
        <div className="text-center p-4 bg-slate-50 rounded-lg">
          <Star className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
          <div className="text-2xl font-bold text-slate-800">{product.average_rating.toFixed(1)}</div>
          <div className="text-sm text-slate-600">Average Rating</div>
        </div>
        
        <div className="text-center p-4 bg-slate-50 rounded-lg">
          <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-600" />
          <div className="text-2xl font-bold text-slate-800">{positivePercentage}%</div>
          <div className="text-sm text-slate-600">Positive Rate</div>
        </div>
      </div>

      {/* Sentiment Breakdown */}
      <div className="mb-6">
        <h4 className="font-semibold text-slate-700 mb-3">Sentiment Analysis Breakdown</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Positive Reviews</span>
            <div className="flex items-center gap-2">
              <div className="w-20 bg-slate-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${(sentimentDistribution.positive / reviews.length) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-slate-700 w-8">{sentimentDistribution.positive}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Neutral Reviews</span>
            <div className="flex items-center gap-2">
              <div className="w-20 bg-slate-200 rounded-full h-2">
                <div
                  className="bg-gray-500 h-2 rounded-full"
                  style={{ width: `${(sentimentDistribution.neutral / reviews.length) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-slate-700 w-8">{sentimentDistribution.neutral}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Negative Reviews</span>
            <div className="flex items-center gap-2">
              <div className="w-20 bg-slate-200 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: `${(sentimentDistribution.negative / reviews.length) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-slate-700 w-8">{sentimentDistribution.negative}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rating Distribution Insights */}
      <div className="mb-6">
        <h4 className="font-semibold text-slate-700 mb-3">Rating Distribution Analysis</h4>
        <div className="grid grid-cols-5 gap-2 text-center">
          {[5, 4, 3, 2, 1].map(stars => {
            const percentage = averageRatingByStars(stars);
            return (
              <div key={stars} className="p-2 bg-slate-50 rounded">
                <div className="text-xs text-slate-600 mb-1">{stars}★</div>
                <div className="text-sm font-medium text-slate-800">{percentage}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Insights */}
      <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-indigo-600 mt-0.5" />
          <div>
            <h5 className="font-medium text-indigo-800 mb-1">AI Analysis Insight</h5>
            <p className="text-sm text-indigo-700">
              {positivePercentage >= 80 
                ? "This product shows exceptional customer satisfaction with consistently positive sentiment across reviews."
                : positivePercentage >= 60
                ? "Generally positive reception with room for improvement in specific areas mentioned in reviews."
                : positivePercentage >= 40
                ? "Mixed reception - consider reviewing negative feedback for improvement opportunities."
                : "Product may need significant improvements based on customer feedback patterns."
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductInsights;
