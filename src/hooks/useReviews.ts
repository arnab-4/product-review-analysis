
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Review {
  id: string;
  product_id: string;
  rating: number;
  review_text: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  created_at: string;
  analysis_details?: any;
  final_confidence?: number;
  sentiment_source?: string;
  models_agreed?: boolean;
  has_rating_mismatch?: boolean;
  review_summary?: string;
  ml_confidence?: number;
  ml_sentiment?: string;
}

export const useReviews = (productId: string) => {
  return useQuery({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Review[];
    },
    enabled: !!productId,
  });
};

// Function to call the Flask ML API
const analyzeWithMLModel = async (reviewText: string) => {
  try {
    const response = await fetch('http://localhost:5000/api/analyze-sentiment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reviewText }),
    });
    
    if (!response.ok) {
      throw new Error(`ML API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('ML Model Response:', data);
    return data;
  } catch (error) {
    console.error('Error calling ML API:', error);
    return null;
  }
};

// Function to calculate justified confidence when models disagree
const calculateJustifiedConfidence = (mlConfidence: number, hasRatingMismatch: boolean) => {
  // Base confidence when models disagree
  let baseConfidence = 0.65;
  
  // Increase confidence if there's a rating mismatch (AI detected contextual issue)
  if (hasRatingMismatch) {
    baseConfidence = 0.75;
  }
  
  // Slight adjustment based on ML confidence
  const adjustment = (1 - mlConfidence) * 0.1;
  return Math.min(baseConfidence + adjustment, 0.85);
};

export const useSubmitReview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ productId, rating, reviewText, productName }: {
      productId: string;
      rating: number;
      reviewText: string;
      productName?: string;
    }) => {
      console.log('Starting review submission with enhanced ML integration...');
      
      // Step 1: Get sentiment from Flask ML API
      const mlResult = await analyzeWithMLModel(reviewText);
      
      // Step 2: Get enhanced sentiment analysis and summary from Gemini
      let geminiResult = null;
      try {
        const sentimentResponse = await supabase.functions.invoke('enhanced-sentiment-analysis', {
          body: { 
            reviewText,
            rating,
            productName: productName || ''
          }
        });
        
        if (!sentimentResponse.error) {
          geminiResult = sentimentResponse.data;
          console.log('Gemini Enhanced Response:', geminiResult);
        }
      } catch (error) {
        console.error('Gemini enhanced sentiment analysis failed:', error);
      }
      
      // Step 3: Determine final sentiment and confidence based on new logic
      let finalSentiment = 'neutral';
      let finalConfidence = 0.5;
      let sentimentSource = 'default';
      let analysisDetails = {};
      let modelsAgreed = null;
      
      if (mlResult && geminiResult) {
        const mlSentiment = mlResult.sentiment.toLowerCase();
        const geminiSentiment = geminiResult.sentiment;
        const mlConfidence = mlResult.confidence;
        
        console.log('ML Sentiment:', mlSentiment, 'Confidence:', mlConfidence);
        console.log('Gemini Sentiment:', geminiSentiment);
        console.log('Rating-Sentiment Mismatch:', geminiResult.hasRatingMismatch);
        
        modelsAgreed = mlSentiment === geminiSentiment;
        
        if (modelsAgreed) {
          // Models agree - use ML sentiment and ML confidence as final confidence
          finalSentiment = mlSentiment;
          finalConfidence = mlConfidence;
          sentimentSource = 'both_agree_ml_preferred';
          analysisDetails = {
            agreement: true,
            mlConfidence,
            finalConfidence: mlConfidence,
            reason: 'Both models agreed - using ML model result and confidence'
          };
          console.log('✅ ML and Gemini agree on sentiment:', finalSentiment, 'Using ML confidence:', finalConfidence);
        } else {
          // Models disagree - prefer Gemini with justified confidence
          finalSentiment = geminiSentiment;
          finalConfidence = calculateJustifiedConfidence(mlConfidence, geminiResult.hasRatingMismatch);
          sentimentSource = 'gemini_preferred_disagreement';
          analysisDetails = {
            agreement: false,
            mlConfidence,
            justifiedConfidence: finalConfidence,
            reason: geminiResult.hasRatingMismatch 
              ? 'Models disagreed, AI detected rating-review mismatch - using AI analysis'
              : 'Models disagreed - preferring AI analysis with justified confidence'
          };
          console.log('⚠️ ML and Gemini disagree. Using Gemini:', finalSentiment, 'Justified confidence:', finalConfidence);
        }
      } else if (mlResult) {
        finalSentiment = mlResult.sentiment.toLowerCase();
        finalConfidence = mlResult.confidence;
        sentimentSource = 'ml_only';
        analysisDetails = {
          mlConfidence: mlResult.confidence,
          reason: 'Only ML model available'
        };
        console.log('🤖 Using ML model only:', finalSentiment, 'Confidence:', finalConfidence);
      } else if (geminiResult) {
        finalSentiment = geminiResult.sentiment;
        finalConfidence = 0.75; // Default confidence for Gemini-only
        sentimentSource = 'gemini_only';
        analysisDetails = {
          reason: 'Only AI analysis available'
        };
        console.log('🧠 Using Gemini only:', finalSentiment);
      }
      
      console.log('Final sentiment decision:', finalSentiment, 'Final Confidence:', finalConfidence, 'Source:', sentimentSource);
      
      // Step 4: Insert the review with the determined sentiment and analysis details
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          product_id: productId,
          rating,
          review_text: reviewText,
          sentiment: finalSentiment,
          analysis_details: analysisDetails,
          final_confidence: finalConfidence,
          sentiment_source: sentimentSource,
          models_agreed: modelsAgreed,
          has_rating_mismatch: geminiResult?.hasRatingMismatch || false,
          review_summary: geminiResult?.summary || null,
          ml_confidence: mlResult?.confidence || null,
          ml_sentiment: mlResult?.sentiment?.toLowerCase() || null
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        ...data,
        sentimentAnalysis: {
          mlResult: mlResult || null,
          geminiResult: geminiResult || null,
          finalSentiment,
          finalConfidence,
          sentimentSource,
          modelsAgreed,
          summary: geminiResult?.summary || null,
          hasRatingMismatch: geminiResult?.hasRatingMismatch || false,
          analysisDetails
        }
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', data.product_id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', data.product_id] });
    },
  });
};
