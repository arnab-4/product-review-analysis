
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
    const { reviewText } = await req.json()
    
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
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Analyze the sentiment of this product review and respond with only one word: "positive", "negative", or "neutral". Review: "${reviewText}"`
          }]
        }]
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      console.error('Gemini API error:', data)
      return new Response(
        JSON.stringify({ error: 'Failed to analyze sentiment' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const sentimentText = data.candidates?.[0]?.content?.parts?.[0]?.text?.toLowerCase().trim()
    let sentiment = 'neutral'
    
    if (sentimentText?.includes('positive')) {
      sentiment = 'positive'
    } else if (sentimentText?.includes('negative')) {
      sentiment = 'negative'
    }

    return new Response(
      JSON.stringify({ sentiment }),
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
