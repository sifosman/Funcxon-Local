# Brevo Email Integration Setup

This project uses Brevo (formerly Sendinblue) to send welcome emails to new vendors.

## Setup Instructions

### 1. Create a Brevo Account
1. Go to https://www.brevo.com/ and sign up for a free account
2. Verify your email and complete the setup

### 2. Get Your API Key
1. Log in to Brevo
2. Go to Settings → API Keys → SMTP & API
3. Click "Create a new API key"
4. Name it "Funcxon App" or similar
5. Copy the API key (it starts with `xkeysib-`)

### 3. Configure Environment Variables

Add the following to your `.env` file in the project root:

```env
BREVO_API_KEY=your_brevo_api_key_here
FROM_EMAIL=noreply@funcxon.com
FROM_NAME=Funcxon Team
```

### 4. Verify Sender Domain (Recommended)
For production, you should verify your sending domain:
1. In Brevo, go to Settings → Senders & IP → Domains
2. Add your domain (e.g., funcxon.com)
3. Follow the DNS verification steps

### 5. Deploy the Edge Function

The edge function is located at `supabase/functions/send-vendor-welcome-email/`.

To deploy:
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy send-vendor-welcome-email

# Set environment variables for the function
supabase secrets set BREVO_API_KEY=your_brevo_api_key_here
supabase secrets set FROM_EMAIL=noreply@funcxon.com
supabase secrets set FROM_NAME="Funcxon Team"
```

### 6. Test the Integration

1. Go through the checkout flow and select the Free plan
2. Fill in your details
3. Click "Confirm Free Plan & Continue"
4. You should be taken to the success screen
5. Check your email for the welcome message

## Email Template

The welcome email includes:
- Personalized greeting with user's name
- Confirmation of their selected plan
- Call-to-action button to complete the application
- Professional HTML formatting with your brand colors

## Troubleshooting

### Emails not sending
- Check that `BREVO_API_KEY` is set correctly in Supabase secrets
- Verify the edge function is deployed: `supabase functions list`
- Check edge function logs: `supabase functions logs send-vendor-welcome-email`

### Emails going to spam
- Verify your sending domain in Brevo
- Ask users to add noreply@funcxon.com to their contacts
- Check email content doesn't trigger spam filters

## Free Tier Limits

Brevo's free tier includes:
- 300 emails/day
- Unlimited contacts
- No credit card required

For higher volumes, upgrade to a paid plan at https://www.brevo.com/pricing/
