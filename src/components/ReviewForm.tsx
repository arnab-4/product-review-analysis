import { useState } from "react";
import { Star, Brain, Cpu, CheckCircle, AlertTriangle, Check, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useSubmitReview } from "@/hooks/useReviews";
import LowRatingConfirmDialog from "./LowRatingConfirmDialog";

// New: animated error utility
const errorAnimation =
  "animate-shake text-red-600 transition-all duration-300";

interface ReviewFormProps {
  productId: string;
  productName?: string;
}

const ReviewForm = ({ productId, productName }: ReviewFormProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [lastSubmissionResult, setLastSubmissionResult] = useState<any>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [showLowRatingDialog, setShowLowRatingDialog] = useState(false);
  const { toast } = useToast();
  const submitReview = useSubmitReview();

  // Reset errors on input
  const clearErrors = () => setFormError(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setFormError("Please select a star rating before submitting.");
      toast({
        title: "Rating Required",
        description: "Please select a star rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (reviewText.trim().length < 10) {
      setFormError("Please write at least 10 characters for your review.");
      toast({
        title: "Review Too Short",
        description: "Please write at least 10 characters for your review.",
        variant: "destructive",
      });
      return;
    }

    // Check if rating is below 3 stars and show confirmation dialog
    if (rating < 3) {
      setShowLowRatingDialog(true);
      return;
    }

    // Proceed with submission
    await submitReviewProcess();
  };

  const submitReviewProcess = async () => {
    setFormError(null);

    try {
      const result = await submitReview.mutateAsync({
        productId,
        rating,
        reviewText: reviewText.trim(),
        productName
      });

      setLastSubmissionResult(result);

      const analysis = result.sentimentAnalysis;
      let toastDescription = `Your review has been analyzed with ${(analysis.finalConfidence * 100).toFixed(1)}% confidence.`;

      if (analysis.modelsAgreed) {
        toastDescription += " Both models agreed - using ML confidence!";
      } else {
        toastDescription += " Models disagreed - using justified confidence.";
      }

      if (analysis.hasRatingMismatch) {
        toastDescription += " ⚠️ Rating-review mismatch detected.";
      }

      toast({
        title: "Review Submitted Successfully!",
        description: toastDescription,
      });

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1800);

      setRating(0);
      setReviewText("");

    } catch (error) {
      setFormError("Failed to submit review. Please try again.");
      console.error('Review submission error:', error);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLowRatingConfirm = () => {
    setShowLowRatingDialog(false);
    submitReviewProcess();
  };

  const handleLowRatingCancel = () => {
    setShowLowRatingDialog(false);
  };

  // Animation for the error state using shake (Tailwind animation)
  // Add keyframes in tailwind.config if not present:
  // "shake": { "0%, 100%": { transform: "translateX(0)" }, "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-8px)" }, "20%, 40%, 60%, 80%": { transform: "translateX(8px)" } }

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starNumber = index + 1;
      const isActive = starNumber <= (hoveredRating || rating);

      return (
        <button
          key={index}
          type="button"
          className="transition-colors duration-150"
          onMouseEnter={() => { setHoveredRating(starNumber); clearErrors(); }}
          onMouseLeave={() => setHoveredRating(0)}
          onClick={() => { setRating(starNumber); clearErrors(); }}
        >
          <Star
            size={24}
            className={`${
              isActive
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300 hover:text-yellow-300"
            }`}
          />
        </button>
      );
    });
  };

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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200/50">
        <h3 className="text-xl font-bold text-slate-800 mb-4">Write a Review</h3>

        <form onSubmit={handleSubmit} className="space-y-4 relative">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Your Rating
            </label>
            <div className="flex items-center gap-1">
              {renderStars()}
              {rating > 0 && (
                <span className="ml-2 text-sm text-slate-600">
                  {rating} out of 5 stars
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Your Review
            </label>
            <Textarea
              value={reviewText}
              onChange={e => { setReviewText(e.target.value); clearErrors(); }}
              placeholder="Share your experience with this product..."
              className="min-h-[100px]"
              maxLength={500}
            />
            <div className="text-right text-sm text-slate-500 mt-1">
              {reviewText.length}/500 characters
            </div>
          </div>

          {/* Animated error feedback */}
          {formError && (
            <div className={`flex items-center gap-2 mt-2 text-sm ${errorAnimation}`}>
              <AlertTriangle className="w-4 h-4" />
              <span>{formError}</span>
            </div>
          )}

          {/* Animated Success Checkmark */}
          {showSuccess && (
            <div className="absolute left-0 right-0 mx-auto flex flex-col items-center pointer-events-none z-10 top-2">
              <Check
                className="text-green-500 w-12 h-12 animate-bounce-in"
                strokeWidth={3}
              />
              <span className="text-green-700 font-semibold mt-1 animate-fade-in">
                Thank you for your review!
              </span>
            </div>
          )}

          <Button
            type="submit"
            disabled={submitReview.isPending || rating === 0 || reviewText.trim().length < 10}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 relative"
          >
            {/* Branded loader spinner & success check */}
            {submitReview.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader className="w-5 h-5 animate-spin text-white" />
                <span>Analyzing with Advanced AI...</span>
              </span>
            ) : (
              "Submit Review"
            )}
          </Button>
        </form>

        <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-700 font-medium">
            🧠 Advanced AI Analysis: Dual-model sentiment detection with intelligent confidence scoring
          </p>
          <p className="text-xs text-blue-600 mt-1">
            When models agree: ML confidence used • When models disagree: Justified confidence applied
          </p>
        </div>
      </div>

      {/* Low Rating Confirmation Dialog */}
      <LowRatingConfirmDialog
        isOpen={showLowRatingDialog}
        onConfirm={handleLowRatingConfirm}
        onCancel={handleLowRatingCancel}
        rating={rating}
      />

      {/* Enhanced Analysis Display */}
      {lastSubmissionResult?.sentimentAnalysis && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200/50">
          <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            AI Analysis Results
          </h4>
          
          {/* Summary */}
          {lastSubmissionResult.sentimentAnalysis.summary && (
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 rounded-r-lg">
              <h5 className="font-medium text-slate-800 mb-2">Review Summary</h5>
              <p className="text-slate-700 italic text-sm">
                "{lastSubmissionResult.sentimentAnalysis.summary}"
              </p>
            </div>
          )}

          {/* Confidence and Sentiment Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  lastSubmissionResult.sentimentAnalysis.finalSentiment === 'positive' 
                    ? 'bg-green-100 text-green-800' 
                    : lastSubmissionResult.sentimentAnalysis.finalSentiment === 'negative'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {lastSubmissionResult.sentimentAnalysis.finalSentiment.charAt(0).toUpperCase() + 
                   lastSubmissionResult.sentimentAnalysis.finalSentiment.slice(1)} Sentiment
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Final Confidence:</span>
                <span className={`font-bold ${getConfidenceColor(lastSubmissionResult.sentimentAnalysis.finalConfidence)}`}>
                  {(lastSubmissionResult.sentimentAnalysis.finalConfidence * 100).toFixed(1)}%
                </span>
                <span className={`text-xs px-2 py-1 rounded ${getConfidenceColor(lastSubmissionResult.sentimentAnalysis.finalConfidence)} bg-opacity-10`}>
                  {getConfidenceLabel(lastSubmissionResult.sentimentAnalysis.finalConfidence)}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {lastSubmissionResult.sentimentAnalysis.modelsAgreed 
                  ? 'ML Model Confidence (Models Agreed)'
                  : 'Justified Confidence (Models Disagreed)'
                }
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {lastSubmissionResult.sentimentAnalysis.modelsAgreed ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                )}
                <span className="text-sm font-medium text-slate-700">
                  {lastSubmissionResult.sentimentAnalysis.modelsAgreed ? 'Models Agreed' : 'Models Disagreed'}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                {lastSubmissionResult.sentimentAnalysis.modelsAgreed 
                  ? 'Using ML model result and confidence'
                  : 'Using AI model result with justified confidence'
                }
              </p>
            </div>
          </div>

          {/* Model Details */}
          <div className="space-y-3">
            <h6 className="font-medium text-slate-700 text-sm">Analysis Breakdown:</h6>
            
            {/* ML Model Results */}
            {lastSubmissionResult.sentimentAnalysis.mlResult && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Cpu className="w-4 h-4 text-gray-600" />
                <div className="flex-1">
                  <span className="text-sm text-slate-700">ML Model:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    lastSubmissionResult.sentimentAnalysis.mlResult.sentiment.toLowerCase() === 'positive' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {lastSubmissionResult.sentimentAnalysis.mlResult.sentiment}
                  </span>
                  <span className="ml-2 text-xs text-slate-600">
                    ({(lastSubmissionResult.sentimentAnalysis.mlResult.confidence * 100).toFixed(1)}%)
                  </span>
                  {lastSubmissionResult.sentimentAnalysis.modelsAgreed && (
                    <span className="ml-2 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                      ✓ Used as Final
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Gemini Results */}
            {lastSubmissionResult.sentimentAnalysis.geminiResult && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Brain className="w-4 h-4 text-blue-600" />
                <div className="flex-1">
                  <span className="text-sm text-slate-700">AI Model:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    lastSubmissionResult.sentimentAnalysis.geminiResult.sentiment === 'positive' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {lastSubmissionResult.sentimentAnalysis.geminiResult.sentiment}
                  </span>
                  {lastSubmissionResult.sentimentAnalysis.hasRatingMismatch && (
                    <span className="ml-2 px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-700">
                      ⚠️ Mismatch Detected
                    </span>
                  )}
                  {!lastSubmissionResult.sentimentAnalysis.modelsAgreed && (
                    <span className="ml-2 text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
                      ✓ Preferred Result
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Confidence Logic Explanation */}
          <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
            <p className="text-xs text-indigo-700">
              <strong>Confidence Logic:</strong> {lastSubmissionResult.sentimentAnalysis.analysisDetails?.reason}
            </p>
            {lastSubmissionResult.sentimentAnalysis.modelsAgreed ? (
              <p className="text-xs text-green-700 mt-1">
                ✓ Models agreed - Final confidence is ML model confidence ({(lastSubmissionResult.sentimentAnalysis.mlResult?.confidence * 100).toFixed(1)}%)
              </p>
            ) : (
              <p className="text-xs text-yellow-700 mt-1">
                ⚠️ Models disagreed - Final confidence is justified confidence ({(lastSubmissionResult.sentimentAnalysis.finalConfidence * 100).toFixed(1)}%)
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewForm;