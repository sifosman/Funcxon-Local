# Places Autocomplete Edge Function

This Supabase Edge Function proxies Google Maps Places Autocomplete API requests to enable address autocomplete functionality in the mobile app.

## Deployment

### 1. Set up Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the **Places API** for your project
3. Create an API key with Places API access
4. Restrict the API key to only allow Places API requests

### 2. Deploy the Edge Function

```bash
# Login to Supabase CLI
supabase login

# Link your project
supabase link --project-ref fhlocaqndxawkbztncwo

# Set the Google Maps API key as a secret
supabase secrets set GOOGLE_MAPS_API_KEY=your_api_key_here

# Deploy the function
supabase functions deploy places-autocomplete
```

### 3. Verify Deployment

Test the function using curl:

```bash
curl -i --location --request POST 'https://fhlocaqndxawkbztncwo.supabase.co/functions/v1/places-autocomplete' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"input":"123 Main Street"}'
```

## How It Works

- The mobile app sends address search queries to this edge function
- The function forwards the request to Google Maps Places Autocomplete API
- Results are returned to the app with proper CORS headers
- This approach keeps the API key secure on the server side

## Usage in App

The `AddressAutocompleteInput` component automatically uses this function when users type in billing or physical address fields.
