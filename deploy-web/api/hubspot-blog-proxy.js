// Vercel Serverless Function - HubSpot Blog Proxy
// Avoids CORS by proxying requests server-side

const HUBSPOT_API_BASE = 'https://api.hubapi.com/cms/v3/blogs/posts';
const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    return res.status(200).end();
  }

  try {
    if (!HUBSPOT_ACCESS_TOKEN) {
      return res.status(500).json({ error: 'HubSpot access token not configured' });
    }

    const { action, limit = '20', slug } = req.query;

    let hubspotUrl;

    switch (action) {
      case 'list': {
        hubspotUrl = `${HUBSPOT_API_BASE}?state__eq=PUBLISHED&limit=${limit}&sort=-publishDate`;
        break;
      }
      case 'slug': {
        if (!slug) {
          return res.status(400).json({ error: 'Missing slug parameter' });
        }
        hubspotUrl = `${HUBSPOT_API_BASE}?slug__eq=${encodeURIComponent(slug)}&state__eq=PUBLISHED&limit=1`;
        break;
      }
      case 'slugs': {
        hubspotUrl = `${HUBSPOT_API_BASE}?state__eq=PUBLISHED&limit=100&sort=-publishDate`;
        break;
      }
      default:
        return res.status(400).json({ error: 'Invalid action. Use: list, slug, or slugs' });
    }

    const response = await fetch(hubspotUrl, {
      headers: {
        Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: `HubSpot API error: ${response.status}`,
        details: errorText
      });
    }

    const data = await response.json();

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(data);

  } catch (error) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ error: error.message });
  }
}
