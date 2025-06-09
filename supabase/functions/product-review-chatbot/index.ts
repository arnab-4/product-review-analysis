
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productId, question, productName } = await req.json();
    
    console.log('Chatbot request for product:', productId, 'Question:', question);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch all reviews for this product
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
      throw new Error('Failed to fetch reviews');
    }

    console.log(`Found ${reviews?.length || 0} reviews for product ${productId}`);

    // Prepare context from reviews
    const reviewsContext = reviews?.map(review => ({
      rating: review.rating,
      text: review.review_text,
      sentiment: review.sentiment,
      summary: review.review_summary,
      confidence: review.final_confidence,
      date: review.created_at
    })) || [];

    // Calculate review statistics
    const totalReviews = reviewsContext.length;
    const averageRating = totalReviews > 0 
      ? reviewsContext.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;
    const positiveReviews = reviewsContext.filter(r => r.sentiment === 'positive').length;
    const negativeReviews = reviewsContext.filter(r => r.sentiment === 'negative').length;
    const neutralReviews = reviewsContext.filter(r => r.sentiment === 'neutral').length;

    // If no reviews available, provide a basic response
    if (totalReviews === 0) {
      return new Response(
        JSON.stringify({ 
          answer: `I don't have any customer reviews for ${productName} yet. Once customers start leaving reviews, I'll be able to answer questions about the product based on their feedback.`,
          reviewsAnalyzed: 0,
          averageRating: "0",
          sentimentBreakdown: {
            positive: 0,
            negative: 0,
            neutral: 0
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Use Gemini API key
    const GEMINI_API_KEY = "AIzaSyDsE0WjhNhoHAo5erArhxIBhs3EKSA4QjQ";

    // Create a comprehensive context for the AI
    const contextSummary = `
Product: ${productName}
Total Reviews: ${totalReviews}
Average Rating: ${averageRating.toFixed(1)}/5
Positive Reviews: ${positiveReviews}
Negative Reviews: ${negativeReviews}
Neutral Reviews: ${neutralReviews}

Recent Reviews Summary:
${reviewsContext.slice(0, 10).map(review => 
  `- Rating: ${review.rating}/5 | Sentiment: ${review.sentiment} | Text: "${review.text.substring(0, 200)}..."`
).join('\n')}
`;

    const prompt = `You are a helpful product review assistant analyzing customer reviews for ${productName}.

Review Data:
${contextSummary}

Customer Question: ${question}

Instructions:
- Answer the question based strictly on the review data provided
- Mention specific review patterns, common complaints, or praise when relevant
- Include relevant statistics (average rating, sentiment distribution)
- Be honest about limitations - if reviews don't cover the topic, say so
- Keep responses concise but informative (under 300 words)
- Use a friendly, helpful tone
- Focus on answering the specific question asked

Please provide a helpful answer based on the customer reviews:`;

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        }
      }),
    });

    if (!response.ok) {
      console.error('Gemini API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Gemini API error details:', errorText);
      
      // Fallback to a comprehensive response based on review data
      let fallbackAnswer = `Based on the ${totalReviews} reviews for ${productName}:\n\n`;
      fallbackAnswer += `📊 **Review Summary:**\n`;
      fallbackAnswer += `• Average Rating: ${averageRating.toFixed(1)}/5 stars\n`;
      fallbackAnswer += `• Positive Reviews: ${positiveReviews}\n`;
      fallbackAnswer += `• Negative Reviews: ${negativeReviews}\n`;
      fallbackAnswer += `• Neutral Reviews: ${neutralReviews}\n\n`;

      if (totalReviews > 0) {
        fallbackAnswer += `**Recent Customer Feedback:**\n`;
        reviewsContext.slice(0, 3).forEach((review, index) => {
          fallbackAnswer += `${index + 1}. "${review.text.substring(0, 100)}..." (${review.rating}⭐ - ${review.sentiment})\n`;
        });
      }

      // Try to answer common questions with the available data
      const questionLower = question.toLowerCase();
      if (questionLower.includes('positive') || questionLower.includes('good')) {
        fallbackAnswer += `\n**About Positive Aspects:**\nThere are ${positiveReviews} positive reviews out of ${totalReviews} total reviews.`;
      } else if (questionLower.includes('negative') || questionLower.includes('bad') || questionLower.includes('problem')) {
        fallbackAnswer += `\n**About Issues:**\nThere are ${negativeReviews} negative reviews highlighting potential concerns.`;
      } else if (questionLower.includes('rating') || questionLower.includes('star')) {
        fallbackAnswer += `\n**About Ratings:**\nThe average rating is ${averageRating.toFixed(1)} out of 5 stars based on ${totalReviews} reviews.`;
      }

      return new Response(
        JSON.stringify({ 
          answer: fallbackAnswer,
          reviewsAnalyzed: totalReviews,
          averageRating: averageRating.toFixed(1),
          sentimentBreakdown: {
            positive: positiveReviews,
            negative: negativeReviews,
            neutral: neutralReviews
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await response.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm having trouble generating a response right now.";

    console.log('Generated answer:', answer);

    return new Response(
      JSON.stringify({ 
        answer,
        reviewsAnalyzed: totalReviews,
        averageRating: averageRating.toFixed(1),
        sentimentBreakdown: {
          positive: positiveReviews,
          negative: negativeReviews,
          neutral: neutralReviews
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in product-review-chatbot function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        answer: "I'm having trouble analyzing the review data right now, but I can see this product has reviews available. Please try asking a specific question about the product features, quality, or customer satisfaction."
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
