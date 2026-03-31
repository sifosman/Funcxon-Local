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

    const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    url.searchParams.set('input', input.trim());
    url.searchParams.set('key', GOOGLE_MAPS_API_KEY);
    url.searchParams.set('types', 'address');

    const response = await fetch(url.toString());
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message, predictions: [] }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
