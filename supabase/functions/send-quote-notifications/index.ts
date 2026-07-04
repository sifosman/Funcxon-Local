// Quote Notifications Edge Function
// Sends email notifications for quote lifecycle events

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const BREVO_API_URL = 'https://api.brevo.com/v3';

// Notification types
type NotificationType =
  | 'quote-requested-vendor'      // New quote request to vendor
  | 'quote-created-client'        // Quote created/sent to client
  | 'quote-accepted-vendor'      // Client accepted quote
  | 'quote-rejected-vendor'      // Client rejected quote
  | 'quote-revised-client';      // Revised quote to client

interface NotificationPayload {
  type: NotificationType;
  quoteRequestId: number;
  quoteRevisionId?: number;

  // Vendor/Venue info
  vendorName?: string;
  vendorEmail?: string;
  vendorBusinessName?: string;
  isVenue?: boolean;

  // Client info
  clientName?: string;
  clientEmail?: string;

  // Quote details (kept for backwards compatibility, no longer displayed in email)
  quoteAmount?: number;
  quoteDescription?: string;
  eventDetails?: string;
  eventDate?: string;

  // Line items (catalogue selections)
  lineItems?: { title: string; quantity: number; price: number }[];

  // Response details (kept for backwards compatibility, no longer displayed in email)
  clientNotes?: string;
  revisionNumber?: number;

  // Attachments (no longer included in email)
  attachments?: { url?: string; name?: string }[];
}

interface BrevoEmailPayload {
  sender: { name: string; email: string };
  to: { email: string; name: string }[];
  subject: string;
  htmlContent: string;
  textContent: string;
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
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'noreply@funxon.co.za';
    const fromName = Deno.env.get('FROM_NAME') || 'Funxon Platform';

    if (!brevoApiKey) {
      throw new Error('BREVO_API_KEY environment variable is not set');
    }

    const payload: NotificationPayload = await req.json();

    if (!payload.type || !payload.quoteRequestId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: type, quoteRequestId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate email content
    const { subject, htmlContent, textContent } = generateEmailContent(payload);

    // Determine recipient
    const recipientEmail = payload.vendorEmail || payload.clientEmail;
    const recipientName = payload.vendorName || payload.clientName || 'Funxon User';

    if (!recipientEmail) {
      return new Response(
        JSON.stringify({ error: 'No recipient email provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const brevoPayload: BrevoEmailPayload = {
      sender: { name: fromName, email: fromEmail },
      to: [{ email: recipientEmail, name: recipientName }],
      subject,
      htmlContent,
      textContent,
    };

    // Send email via Brevo
    const brevoResponse = await fetch(`${BREVO_API_URL}/smtp/email`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': brevoApiKey,
      },
      body: JSON.stringify(brevoPayload),
    });

    if (!brevoResponse.ok) {
      const errorData = await brevoResponse.json();
      throw new Error(`Brevo API error: ${JSON.stringify(errorData)}`);
    }

    const brevoResult = await brevoResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Quote notification sent successfully',
        messageId: brevoResult.messageId,
        type: payload.type,
        recipient: recipientEmail,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending quote notification:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to send quote notification',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateEmailContent(payload: NotificationPayload): { subject: string; htmlContent: string; textContent: string } {
  switch (payload.type) {
    case 'quote-requested-vendor':
      return generateQuoteRequestedToVendorEmail(payload);
    case 'quote-created-client':
      return generateQuoteCreatedToClientEmail(payload);
    case 'quote-accepted-vendor':
      return generateQuoteAcceptedToVendorEmail(payload);
    case 'quote-rejected-vendor':
      return generateQuoteRejectedToVendorEmail(payload);
    case 'quote-revised-client':
      return generateQuoteRevisedToClientEmail(payload);
    default:
      return generateGenericEmail(payload);
  }
}

function generateQuoteRequestedToVendorEmail(payload: NotificationPayload) {
  const { vendorBusinessName, lineItems, eventDate } = payload;
  const subject = 'New Quote Request';
  const deepLink = 'funxon://vendor/quotes';

  const itemsHtml = lineItems && lineItems.length > 0
    ? `
      <div style="background: #F5F1E8; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #D4CFBD;">
        <h3 style="margin-top: 0; color: #2B9EB3;">Requested Items</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid #D4CFBD;">
              <th style="text-align: left; padding: 8px 0; color: #2B3840; font-size: 14px;">Item</th>
              <th style="text-align: center; padding: 8px 0; color: #2B3840; font-size: 14px;">Qty</th>
              <th style="text-align: right; padding: 8px 0; color: #2B3840; font-size: 14px;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${lineItems.map((item) => `
              <tr style="border-bottom: 1px solid #E8E4D7;">
                <td style="padding: 8px 0; color: #2B3840; font-size: 15px;">${escapeHtml(item.title)}</td>
                <td style="text-align: center; padding: 8px 0; color: #2B3840; font-size: 15px;">${item.quantity}</td>
                <td style="text-align: right; padding: 8px 0; color: #2B3840; font-size: 15px;">R${(item.price * item.quantity).toLocaleString('en-ZA')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="text-align: right; margin-top: 12px; padding-top: 8px; border-top: 2px solid #2B9EB3;">
          <strong style="color: #2B9EB3; font-size: 16px;">Estimated Total: R${lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toLocaleString('en-ZA')}</strong>
        </div>
      </div>
    `
    : '';

  const itemsText = lineItems && lineItems.length > 0
    ? `\nRequested Items:\n${lineItems.map((item) => `  - ${item.title} (Qty: ${item.quantity}) - R${(item.price * item.quantity).toLocaleString('en-ZA')}`).join('\n')}\nEstimated Total: R${lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toLocaleString('en-ZA')}\n`
    : '';

  const eventDateText = eventDate ? `Event date: ${eventDate}\n` : '';

  const htmlContent = genericEmailHtml({
    title: 'New Quote Request',
    greeting: `Hi ${vendorBusinessName || 'there'},`,
    message: `You have received a new quote request.${eventDate ? ` Event date: ${eventDate}.` : ''} Open the Funxon app to view the details and respond.`,
    deepLink,
    cta: 'Open the Funxon App',
    accentColor: '#2B9EB3',
    extraContent: itemsHtml,
  });

  const textContent = genericEmailText({
    title: 'New Quote Request',
    greeting: `Hi ${vendorBusinessName || 'there'},`,
    message: `You have received a new quote request.${eventDate ? ` Event date: ${eventDate}.` : ''} Open the Funxon app to view the details and respond.`,
    deepLink,
    extraContent: eventDateText + itemsText,
  });

  return { subject, htmlContent, textContent };
}

function generateQuoteCreatedToClientEmail(payload: NotificationPayload) {
  const { clientName } = payload;
  const subject = 'Quote Received';
  const deepLink = 'funxon://quotes';

  const htmlContent = genericEmailHtml({
    title: 'Quote Received',
    greeting: `Hi ${clientName || 'there'},`,
    message: 'You have received a new quote. Open the Funxon app to review and respond.',
    deepLink,
    cta: 'Open the Funxon App',
    accentColor: '#2B9EB3',
  });

  const textContent = genericEmailText({
    title: 'Quote Received',
    greeting: `Hi ${clientName || 'there'},`,
    message: 'You have received a new quote. Open the Funxon app to review and respond.',
    deepLink,
  });

  return { subject, htmlContent, textContent };
}

function generateQuoteAcceptedToVendorEmail(payload: NotificationPayload) {
  const { vendorBusinessName } = payload;
  const subject = 'Quote Accepted';
  const deepLink = 'funxon://vendor/quotes';

  const htmlContent = genericEmailHtml({
    title: 'Quote Accepted',
    greeting: `Great news, ${vendorBusinessName || 'there'}!`,
    message: 'A client has accepted your quote. Open the Funxon app to view the details and next steps.',
    deepLink,
    cta: 'Open the Funxon App',
    accentColor: '#16A34A',
  });

  const textContent = genericEmailText({
    title: 'Quote Accepted',
    greeting: `Great news, ${vendorBusinessName || 'there'}!`,
    message: 'A client has accepted your quote. Open the Funxon app to view the details and next steps.',
    deepLink,
  });

  return { subject, htmlContent, textContent };
}

function generateQuoteRejectedToVendorEmail(payload: NotificationPayload) {
  const { vendorBusinessName } = payload;
  const subject = 'Quote Not Accepted';
  const deepLink = 'funxon://vendor/quotes';

  const htmlContent = genericEmailHtml({
    title: 'Quote Not Accepted',
    greeting: `Hi ${vendorBusinessName || 'there'},`,
    message: 'A client has decided not to proceed with your quote at this time. Open the Funxon app to view their feedback and submit a revised quote if you wish.',
    deepLink,
    cta: 'Open the Funxon App',
    accentColor: '#DC2626',
  });

  const textContent = genericEmailText({
    title: 'Quote Not Accepted',
    greeting: `Hi ${vendorBusinessName || 'there'},`,
    message: 'A client has decided not to proceed with your quote at this time. Open the Funxon app to view their feedback and submit a revised quote if you wish.',
    deepLink,
  });

  return { subject, htmlContent, textContent };
}

function generateQuoteRevisedToClientEmail(payload: NotificationPayload) {
  const { clientName } = payload;
  const subject = 'Revised Quote Available';
  const deepLink = 'funxon://quotes';

  const htmlContent = genericEmailHtml({
    title: 'Revised Quote Available',
    greeting: `Hi ${clientName || 'there'},`,
    message: 'A revised quote is now available for your review. Open the Funxon app to see the updated details and respond.',
    deepLink,
    cta: 'Open the Funxon App',
    accentColor: '#D97706',
  });

  const textContent = genericEmailText({
    title: 'Revised Quote Available',
    greeting: `Hi ${clientName || 'there'},`,
    message: 'A revised quote is now available for your review. Open the Funxon app to see the updated details and respond.',
    deepLink,
  });

  return { subject, htmlContent, textContent };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface GenericEmailOptions {
  title: string;
  greeting: string;
  message: string;
  deepLink: string;
  cta?: string;
  accentColor?: string;
  extraContent?: string;
}

function genericEmailHtml(options: GenericEmailOptions): string {
  const { title, greeting, message, deepLink, cta = 'Open the Funxon App', accentColor = '#2B9EB3', extraContent = '' } = options;
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #2B3840; max-width: 600px; margin: 0 auto; padding: 20px; background: #F8F6F0;">
      <div style="background: ${accentColor}; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">${title}</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #D4CFBD; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-bottom: 20px; color: #2B3840;">${greeting}</p>
        <p style="font-size: 16px; margin-bottom: 20px; color: #2B3840;">${message}</p>
        ${extraContent}
        <div style="text-align: center; margin: 30px 0;">
          <a href="${deepLink}"
             style="background: ${accentColor}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            ${cta}
          </a>
        </div>
        <p style="font-size: 14px; color: #5A7A85; margin-top: 20px;">
          Tap the button above to open the Funxon app and view the full details.
        </p>
      </div>
    </body>
    </html>
  `;
}

function genericEmailText(options: GenericEmailOptions): string {
  const { title, greeting, message, deepLink, extraContent = '' } = options;
  return `
${title}

${greeting}

${message}
${extraContent}
Open the Funxon app to view the details:
${deepLink}

- Funxon Team
  `;
}

function generateGenericEmail(payload: NotificationPayload) {
  const subject = `Quote Update - ${payload.type}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Quote Update</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #2B3840; max-width: 600px; margin: 0 auto; padding: 20px; background: #F8F6F0;">
      <div style="background: #F5F1E8; padding: 30px; border-radius: 10px; border: 1px solid #D4CFBD;">
        <h2 style="color: #2B9EB3;">Quote Update</h2>
        <p style="color: #2B3840;">There has been an update to your quote request.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="funxon://quotes" 
             style="background: #2B9EB3; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            View Quote
          </a>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Quote Update

There has been an update to your quote request.

View quote: funxon://quotes

- Funxon Team
  `;

  return { subject, htmlContent, textContent };
}
