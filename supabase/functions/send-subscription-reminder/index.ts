// Subscription Reminder Edge Function
// Sends reminder emails to vendors whose subscriptions are expiring soon.
// - 5 days before expiry (first reminder)
// - 1 day before expiry (final reminder)
// 
// Can be triggered by a Supabase cron job (pg_cron) or called manually.
// The email includes a deep link to the billing screen in the app.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const BREVO_API_URL = 'https://api.brevo.com/v3';

// Deep link to open billing screen in the app
const BILLING_DEEP_LINK = 'https://funcxon.com/app/billing';

interface VendorReminder {
  vendor_id: number;
  vendor_name: string;
  email: string;
  billing_email: string | null;
  subscription_tier: string;
  subscription_expires_at: string;
  billing_period: string;
  price_monthly: number | null;
  price_yearly: number | null;
  days_until_expiry: number;
}

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const brevoApiKey = Deno.env.get('BREVO_API_KEY');
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'noreply@funcxon.com';
    const fromName = Deno.env.get('FROM_NAME') || 'Funcxon Team';
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!brevoApiKey) {
      throw new Error('BREVO_API_KEY environment variable is not set');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find vendors with subscriptions expiring in 5 days (not yet reminded)
    const { data: fiveDayVendors, error: fiveDayError } = await supabase
      .rpc('get_expiring_vendors', { days_ahead: 5, reminder_type: '5day' });

    // Find vendors with subscriptions expiring in 1 day (not yet reminded)
    const { data: oneDayVendors, error: oneDayError } = await supabase
      .rpc('get_expiring_vendors', { days_ahead: 1, reminder_type: '1day' });

    const results = {
      five_day: { sent: 0, failed: 0, errors: [] as string[] },
      one_day: { sent: 0, failed: 0, errors: [] as string[] },
    };

    // Process 5-day reminders
    if (!fiveDayError && fiveDayVendors) {
      for (const vendor of fiveDayVendors as VendorReminder[]) {
        try {
          const recipientEmail = vendor.billing_email || vendor.email;
          if (!recipientEmail) continue;

          const price = vendor.billing_period === 'yearly' ? vendor.price_yearly : vendor.price_monthly;
          const priceStr = price ? `R${Number(price).toLocaleString()}` : '';

          await sendReminderEmail({
            brevoApiKey,
            fromEmail,
            fromName,
            toEmail: recipientEmail,
            toName: vendor.vendor_name,
            vendorName: vendor.vendor_name,
            tierName: vendor.subscription_tier,
            expiryDate: vendor.subscription_expires_at,
            daysLeft: 5,
            price: priceStr,
            billingPeriod: vendor.billing_period,
            billingLink: BILLING_DEEP_LINK,
          });

          // Mark reminder as sent
          await supabase
            .from('vendors')
            .update({ reminder_5day_sent: true })
            .eq('id', vendor.vendor_id);

          results.five_day.sent++;
        } catch (err) {
          results.five_day.failed++;
          results.five_day.errors.push(`Vendor ${vendor.vendor_id}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }

    // Process 1-day reminders
    if (!oneDayError && oneDayVendors) {
      for (const vendor of oneDayVendors as VendorReminder[]) {
        try {
          const recipientEmail = vendor.billing_email || vendor.email;
          if (!recipientEmail) continue;

          const price = vendor.billing_period === 'yearly' ? vendor.price_yearly : vendor.price_monthly;
          const priceStr = price ? `R${Number(price).toLocaleString()}` : '';

          await sendReminderEmail({
            brevoApiKey,
            fromEmail,
            fromName,
            toEmail: recipientEmail,
            toName: vendor.vendor_name,
            vendorName: vendor.vendor_name,
            tierName: vendor.subscription_tier,
            expiryDate: vendor.subscription_expires_at,
            daysLeft: 1,
            price: priceStr,
            billingPeriod: vendor.billing_period,
            billingLink: BILLING_DEEP_LINK,
          });

          // Mark reminder as sent
          await supabase
            .from('vendors')
            .update({ reminder_1day_sent: true })
            .eq('id', vendor.vendor_id);

          results.one_day.sent++;
        } catch (err) {
          results.one_day.failed++;
          results.one_day.errors.push(`Vendor ${vendor.vendor_id}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Subscription reminders processed',
        results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing subscription reminders:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process subscription reminders',
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ── Email sender ──

interface ReminderEmailParams {
  brevoApiKey: string;
  fromEmail: string;
  fromName: string;
  toEmail: string;
  toName: string;
  vendorName: string;
  tierName: string;
  expiryDate: string;
  daysLeft: number;
  price: string;
  billingPeriod: string;
  billingLink: string;
}

async function sendReminderEmail(params: ReminderEmailParams) {
  const {
    brevoApiKey, fromEmail, fromName,
    toEmail, toName, vendorName, tierName,
    expiryDate, daysLeft, price, billingPeriod, billingLink,
  } = params;

  const formattedExpiry = new Date(expiryDate).toLocaleDateString('en-ZA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const isUrgent = daysLeft <= 1;
  const urgencyColor = isUrgent ? '#DC2626' : '#F59E0B';
  const urgencyLabel = isUrgent ? 'EXPIRES TOMORROW' : `EXPIRES IN ${daysLeft} DAYS`;

  const subject = isUrgent
    ? `⚠️ Your Funcxon subscription expires tomorrow — Renew now`
    : `Reminder: Your Funcxon subscription expires in ${daysLeft} days`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background: linear-gradient(135deg, #2D5A4C 0%, #4A7C6F 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Subscription Renewal Reminder</h1>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <!-- Urgency Banner -->
        <div style="background: ${urgencyColor}15; border: 2px solid ${urgencyColor}; border-radius: 8px; padding: 15px; text-align: center; margin-bottom: 25px;">
          <p style="color: ${urgencyColor}; font-weight: bold; font-size: 14px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">
            ${urgencyLabel}
          </p>
        </div>

        <p style="font-size: 16px;">Hi ${vendorName},</p>
        
        <p>Your <strong>${tierName.charAt(0).toUpperCase() + tierName.slice(1)}</strong> subscription on Funcxon is set to expire on <strong>${formattedExpiry}</strong>.</p>
        
        ${isUrgent ? '<p style="color: #DC2626; font-weight: bold;">To avoid any interruption to your listing and services, please renew your subscription today.</p>' : '<p>To keep your listing active and continue receiving bookings, please renew before it expires.</p>'}
        
        <!-- Subscription Details -->
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="margin-top: 0; color: #2D5A4C; font-size: 16px;">Your Subscription Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666;">Plan</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold;">${tierName.charAt(0).toUpperCase() + tierName.slice(1)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Billing</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold;">${billingPeriod === 'yearly' ? 'Yearly' : 'Monthly'}</td>
            </tr>
            ${price ? `<tr>
              <td style="padding: 8px 0; color: #666;">Amount Due</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #2D5A4C;">${price}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 8px 0; color: #666;">Expires</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold; color: ${urgencyColor};">${formattedExpiry}</td>
            </tr>
          </table>
        </div>
        
        <!-- CTA Button -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${billingLink}" 
             style="background: #2D5A4C; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
            Renew Now
          </a>
        </div>
        
        <p style="font-size: 13px; color: #999; text-align: center;">
          Or open the Funcxon app → Account → Subscriber Suite → Billing & Payments
        </p>
        
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        
        <p style="font-size: 13px; color: #666;">
          If you no longer wish to continue your subscription, no action is needed and your plan will revert to the free tier after expiry.
        </p>
        
        <p style="font-size: 13px; color: #666;">
          Questions? Contact us at <a href="mailto:support@funcxon.com" style="color: #2D5A4C;">support@funcxon.com</a>
        </p>
        
        <p style="font-size: 13px; color: #666; margin-top: 5px;">— The Funcxon Team</p>
      </div>
      
      <div style="text-align: center; padding: 20px;">
        <p style="font-size: 11px; color: #999;">
          You are receiving this email because you have an active subscription on Funcxon.
        </p>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Subscription Renewal Reminder

Hi ${vendorName},

Your ${tierName} subscription on Funcxon is set to expire on ${formattedExpiry}.

${isUrgent ? 'To avoid any interruption to your listing and services, please renew your subscription today.' : 'To keep your listing active and continue receiving bookings, please renew before it expires.'}

Your Subscription Details:
- Plan: ${tierName}
- Billing: ${billingPeriod === 'yearly' ? 'Yearly' : 'Monthly'}
${price ? `- Amount Due: ${price}` : ''}
- Expires: ${formattedExpiry}

Renew Now: ${billingLink}

Or open the Funcxon app → Account → Subscriber Suite → Billing & Payments

If you no longer wish to continue your subscription, no action is needed and your plan will revert to the free tier after expiry.

Questions? Contact us at support@funcxon.com

— The Funcxon Team
  `;

  const response = await fetch(`${BREVO_API_URL}/smtp/email`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'api-key': brevoApiKey,
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: [{ email: toEmail, name: toName }],
      subject,
      htmlContent,
      textContent,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Brevo API error: ${JSON.stringify(errorData)}`);
  }

  return await response.json();
}
