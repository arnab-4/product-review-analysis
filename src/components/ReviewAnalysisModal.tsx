
import { Brain, Cpu, CheckCircle, AlertTriangle, BarChart3, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Review } from "@/hooks/useReviews";

interface ReviewAnalysisModalProps {
  review: Review;
  isOpen: boolean;
  onClose: () => void;
}

const ReviewAnalysisModal = ({ review, isOpen, onClose }: ReviewAnalysisModalProps) => {
  if (!isOpen) return null;

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-orange-600";
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return "High";
    if (confidence >= 0.6) return "Medium";
    return "Low";
  };

  const getConfidenceSource = () => {
    if (review.models_agreed) {
      return "ML Model Confidence (Models Agreed)";
    } else {
      return "Justified Confidence (Models Disagreed)";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-indigo-600" />
              Review Analysis Details
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Review Summary */}
          {review.review_summary && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 rounded-r-lg">
              <h4 className="font-medium text-slate-800 mb-2">AI Generated Summary</h4>
              <p className="text-slate-700 italic text-sm">"{review.review_summary}"</p>
            </div>
          )}

          {/* Overall Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  review.sentiment === 'positive' 
                    ? 'bg-green-100 text-green-800' 
                    : review.sentiment === 'negative'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {review.sentiment?.charAt(0).toUpperCase() + review.sentiment?.slice(1)} Sentiment
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Final Confidence:</span>
                <span className={`font-bold ${getConfidenceColor(review.final_confidence || 0)}`}>
                  {((review.final_confidence || 0) * 100).toFixed(1)}%
                </span>
                <span className={`text-xs px-2 py-1 rounded ${getConfidenceColor(review.final_confidence || 0)} bg-opacity-10`}>
                  {getConfidenceLabel(review.final_confidence || 0)}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {getConfidenceSource()}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {review.models_agreed ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                )}
                <span className="text-sm font-medium text-slate-700">
                  {review.models_agreed ? 'Models Agreed' : 'Models Disagreed'}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                {review.models_agreed 
                  ? 'Using ML model result with ML confidence'
                  : 'Using AI model result with justified confidence'
                }
              </p>
            </div>
          </div>

          {/* Model Breakdown */}
          <div className="space-y-4 mb-6">
            <h4 className="font-medium text-slate-700">Model Analysis Breakdown:</h4>
            
            {/* ML Model Results */}
            {review.ml_sentiment && review.ml_confidence && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Cpu className="w-5 h-5 text-gray-600" />
                <div className="flex-1">
                  <span className="text-sm text-slate-700 font-medium">ML Model (Naive Bayes):</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      review.ml_sentiment === 'positive' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {review.ml_sentiment}
                    </span>
                    <span className="text-xs text-slate-600">
                      Confidence: {(review.ml_confidence * 100).toFixed(1)}%
                    </span>
                    {review.models_agreed && (
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        ✓ Used as Final
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Gemini Results */}
            {review.sentiment_source !== 'ml_only' && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Brain className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <span className="text-sm text-slate-700 font-medium">AI Model (Gemini):</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      review.sentiment === 'positive' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {review.sentiment}
                    </span>
                    {review.has_rating_mismatch && (
                      <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-700">
                        ⚠️ Rating Mismatch Detected
                      </span>
                    )}
                    {!review.models_agreed && (
                      <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
                        ✓ Preferred Result
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Analysis Details */}
          <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <h5 className="font-medium text-indigo-800 mb-2">Confidence Logic Explanation</h5>
            <p className="text-sm text-indigo-700 mb-3">
              {review.analysis_details?.reason || 'Analysis completed successfully'}
            </p>
            
            {/* Confidence breakdown */}
            <div className="text-xs text-indigo-600 space-y-1">
              {review.models_agreed ? (
                <div className="bg-green-50 p-2 rounded border border-green-200">
                  <strong>Models Agreed:</strong> Using ML model confidence ({((review.ml_confidence || 0) * 100).toFixed(1)}%) as final confidence
                </div>
              ) : (
                <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
                  <strong>Models Disagreed:</strong> Using justified confidence ({((review.final_confidence || 0) * 100).toFixed(1)}%) based on AI analysis
                  {review.has_rating_mismatch && (
                    <div className="mt-1 text-yellow-700">Higher confidence due to detected rating-review mismatch</div>
                  )}
                </div>
              )}
            </div>
            
            {/* Technical details */}
            <div className="mt-3 text-xs text-indigo-600">
              <div className="grid grid-cols-2 gap-2">
                <span>Source: {review.sentiment_source}</span>
                <span>Agreement: {review.models_agreed ? 'Yes' : 'No'}</span>
                <span>Rating Match: {review.has_rating_mismatch ? 'No' : 'Yes'}</span>
                <span>Final Confidence: {((review.final_confidence || 0) * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewAnalysisModal;
