// Vercel Serverless Function - HubSpot Blog Proxy
// Avoids CORS by proxying requests server-side

const HUBSPOT_API_BASE = 'https://api.hubapi.com/cms/v3/blogs/posts';
const HUBSPOT_TOKEN = process.env.HUBSPOT_API_KEY || process.env.HUBSPOT_ACCESS_TOKEN;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function setCorsHeaders(res) {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    return res.status(200).end();
  }

  try {
    if (!HUBSPOT_TOKEN) {
      setCorsHeaders(res);
      return res.status(500).json({ error: 'HubSpot API key not configured. Set HUBSPOT_API_KEY in Vercel environment variables.' });
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
          setCorsHeaders(res);
          res.setHeader('Content-Type', 'application/json');
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
        setCorsHeaders(res);
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({ error: 'Invalid action. Use: list, slug, or slugs' });
    }

    const response = await fetch(hubspotUrl, {
      headers: {
        Authorization: `Bearer ${HUBSPOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      setCorsHeaders(res);
      res.setHeader('Content-Type', 'application/json');
      return res.status(response.status).json({
        error: `HubSpot API error: ${response.status}`,
        details: errorText
      });
    }

    const data = await response.json();

    setCorsHeaders(res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(data);

  } catch (error) {
    setCorsHeaders(res);
    return res.status(500).json({ error: error.message });
  }
}
