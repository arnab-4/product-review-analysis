
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { reviewText, rating, productName } = await req.json()
    
    if (!reviewText) {
      return new Response(
        JSON.stringify({ error: 'Review text is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const GEMINI_API_KEY = "AIzaSyDsE0WjhNhoHAo5erArhxIBhs3EKSA4QjQ"
    
    // Enhanced prompt for sentiment analysis with rating consideration
    const sentimentPrompt = `You are an expert sentiment analyzer. Analyze this product review considering both the text content and the star rating given.

Review Text: "${reviewText}"
Star Rating: ${rating || 'Not provided'}/5 stars
Product: ${productName || 'Unknown product'}

Important Instructions:
1. Consider BOTH the review text sentiment AND the star rating
2. If there's a mismatch (e.g., 4-5 stars but negative text, or 1-2 stars but positive text), prioritize the TEXT CONTENT over the rating
3. Look for sarcasm, mixed feelings, or conditional praise/criticism
4. A review can be critical but still positive if it shows overall satisfaction
5. Consider context - minor complaints in otherwise positive reviews don't make them negative

Respond with ONLY ONE WORD: "positive", "negative", or "neutral"`;

    // Summary prompt
    const summaryPrompt = `Create a concise 50-word summary of this product review. Focus on the main points, overall sentiment, and key aspects mentioned.

Review: "${reviewText}"
Rating: ${rating || 'Not provided'}/5 stars

Provide ONLY the summary in exactly 50 words or less:`;

    // Make both API calls
    const [sentimentResponse, summaryResponse] = await Promise.all([
      fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: sentimentPrompt }] }]
        })
      }),
      fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: summaryPrompt }] }]
        })
      })
    ]);

    const [sentimentData, summaryData] = await Promise.all([
      sentimentResponse.json(),
      summaryResponse.json()
    ]);

    if (!sentimentResponse.ok || !summaryResponse.ok) {
      console.error('Gemini API error:', { sentimentData, summaryData })
      return new Response(
        JSON.stringify({ error: 'Failed to analyze review' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const sentimentText = sentimentData.candidates?.[0]?.content?.parts?.[0]?.text?.toLowerCase().trim()
    const summaryText = summaryData.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    
    let sentiment = 'neutral'
    if (sentimentText?.includes('positive')) {
      sentiment = 'positive'
    } else if (sentimentText?.includes('negative')) {
      sentiment = 'negative'
    }

    console.log('Gemini Analysis Results:', {
      sentiment,
      summary: summaryText,
      rating,
      reviewText: reviewText.substring(0, 100) + '...'
    });

    return new Response(
      JSON.stringify({ 
        sentiment,
        summary: summaryText || 'Unable to generate summary',
        rating,
        hasRatingMismatch: rating && (
          (rating >= 4 && sentiment === 'negative') || 
          (rating <= 2 && sentiment === 'positive')
        )
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
