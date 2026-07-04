import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { input } = await req.json();

    if (!input || typeof input !== 'string' || input.trim().length < 3) {
      return new Response(
        JSON.stringify({ predictions: [] }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    if (!GOOGLE_MAPS_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    const url = 'https://places.googleapis.com/v1/places:autocomplete';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
      },
      body: JSON.stringify({
        input: input.trim(),
        includedRegionCodes: ['za'],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Google Places API (New) error:', data);
      return new Response(
        JSON.stringify({ predictions: [], error: data?.error?.message || `HTTP ${response.status}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Map new API response to legacy format expected by client
    const predictions = Array.isArray(data?.suggestions)
      ? data.suggestions
          .filter((s: any) => s?.placePrediction)
          .map((s: any) => ({
            description: s.placePrediction.text?.text || '',
            place_id: s.placePrediction.placeId || '',
          }))
          .filter((p: any) => p.description && p.place_id)
      : [];

    return new Response(
      JSON.stringify({ predictions, status: 'OK' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error', predictions: [] }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
