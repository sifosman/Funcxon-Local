# Admin Email Notifications Setup

## Required Environment Variables

Add these environment variables to your Supabase project:

### Brevo Configuration (required)
```
BREVO_API_KEY=your_brevo_api_key_here
FROM_EMAIL=noreply@funcxon.com
FROM_NAME=Funcxon Platform
```

### Admin Recipients (required)
```
ADMIN_EMAIL=admin@funcxon.com
ADMIN_NAME=Funcxon Admin
```

## Setting Up in Supabase

1. Go to your Supabase Dashboard → Project Settings → API
2. Navigate to Edge Functions → Environment Variables
3. Add each variable above with your production values

## Getting Brevo API Key

1. Sign up/login at https://www.brevo.com
2. Go to API Keys → Create a new API key
3. Copy the key and add it to your environment variables

## Deploying the Edge Function

```bash
npx supabase functions deploy send-admin-notification
```

Or if using the Supabase CLI directly:

```bash
supabase functions deploy send-admin-notification
```

## Supported Notification Types

The admin notification function supports these event types:

| Type | Description | Trigger Location |
|------|-------------|------------------|
| `vendor-subscription-purchased` | Paid subscription purchase | SubscriptionCheckoutScreen |
| `vendor-application-submitted` | Vendor application submitted | ApplicationStep4Screen |
| `vendor-free-signup` | Free plan signup | VendorSignupSuccessScreen |
| `quote-requested` | Customer requests quote | QuoteRequestScreen |
| `portfolio-callback-requested` | Vendor requests callback | PortfolioAssistanceScreen |
| `new-user-registered` | New user registered | (Optional future use) |

## Testing

Test the function locally:

```bash
npx supabase functions serve send-admin-notification
```

Then send a test request:

```bash
curl -X POST http://localhost:54321/functions/v1/send-admin-notification \
  -H "Content-Type: application/json" \
  -d '{
    "type": "vendor-subscription-purchased",
    "vendorName": "Test Vendor",
    "vendorEmail": "test@example.com",
    "tierName": "Premium",
    "amount": 299
  }'
```

## Troubleshooting

- Check Supabase Edge Function logs in the Dashboard
- Verify Brevo API key has SMTP email permissions
- Ensure `ADMIN_EMAIL` is set correctly
- Check spam folders for test emails
