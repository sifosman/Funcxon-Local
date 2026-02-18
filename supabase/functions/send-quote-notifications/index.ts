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
  
  // Client info
  clientName?: string;
  clientEmail?: string;
  
  // Quote details
  quoteAmount?: number;
  quoteDescription?: string;
  eventDetails?: string;
  eventDate?: string;
  
  // Response details
  clientNotes?: string;
  revisionNumber?: number;
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
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'noreply@funcxon.com';
    const fromName = Deno.env.get('FROM_NAME') || 'Funcxon Platform';

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
    const recipientName = payload.vendorName || payload.clientName || 'Funcxon User';

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
  const { clientName, vendorBusinessName, eventDetails, eventDate } = payload;
  const subject = `New Quote Request from ${clientName || 'a potential client'}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Quote Request</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #2B3840; max-width: 600px; margin: 0 auto; padding: 20px; background: #F8F6F0;">
      <div style="background: linear-gradient(135deg, #2B9EB3 0%, #9DCFDB 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">New Quote Request</h1>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #D4CFBD; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-bottom: 20px; color: #2B3840;">Hi ${vendorBusinessName || 'there'},</p>
        
        <p style="font-size: 16px; margin-bottom: 20px; color: #2B3840;">
          You have received a new quote request from <strong>${clientName || 'a potential client'}</strong>.
        </p>
        
        ${eventDetails ? `
        <div style="background: #F5F1E8; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #D4CFBD;">
          <h3 style="margin-top: 0; color: #2B9EB3;">Event Details</h3>
          <p style="color: #2B3840;">${eventDetails}</p>
        </div>
        ` : ''}
        
        ${eventDate ? `
        <p style="font-size: 16px; color: #2B3840;">
          <strong>Event Date:</strong> ${eventDate}
        </p>
        ` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://funcxon.com/vendor/quotes" 
             style="background: #2B9EB3; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            View & Respond to Quote
          </a>
        </div>
        
        <p style="font-size: 14px; color: #5A7A85; margin-top: 20px;">
          Log in to your vendor dashboard to create and send a quote to this client.
        </p>
      </div>
    </body>
    </html>
  `;

  const textContent = `
New Quote Request

Hi ${vendorBusinessName || 'there'},

You have received a new quote request from ${clientName || 'a potential client'}.

${eventDetails ? `Event Details:\n${eventDetails}\n\n` : ''}
${eventDate ? `Event Date: ${eventDate}\n\n` : ''}

Log in to your vendor dashboard to view and respond:
https://funcxon.com/vendor/quotes

- Funcxon Team
  `;

  return { subject, htmlContent, textContent };
}

function generateQuoteCreatedToClientEmail(payload: NotificationPayload) {
  const { clientName, vendorBusinessName, quoteAmount, quoteDescription, revisionNumber } = payload;
  const subject = `Quote Received from ${vendorBusinessName || 'your vendor'}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Quote Received</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #2B3840; max-width: 600px; margin: 0 auto; padding: 20px; background: #F8F6F0;">
      <div style="background: linear-gradient(135deg, #2B9EB3 0%, #9DCFDB 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Quote Received</h1>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #D4CFBD; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-bottom: 20px; color: #2B3840;">Hi ${clientName || 'there'},</p>
        
        <p style="font-size: 16px; margin-bottom: 20px; color: #2B3840;">
          <strong>${vendorBusinessName || 'Your vendor'}</strong> has sent you a quote${revisionNumber && revisionNumber > 1 ? ' (Revision #' + revisionNumber + ')' : ''}.
        </p>
        
        <div style="background: #F5F1E8; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #D4CFBD;">
          <h3 style="margin-top: 0; color: #2B9EB3;">Quote Summary</h3>
          ${quoteAmount ? `<p style="color: #2B3840; font-size: 24px; font-weight: bold; margin: 10px 0;">R${quoteAmount.toLocaleString()}</p>` : ''}
          ${quoteDescription ? `<p style="color: #2B3840;">${quoteDescription}</p>` : ''}
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://funcxon.com/quotes" 
             style="background: #2B9EB3; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin-right: 10px;">
            View Quote
          </a>
        </div>
        
        <p style="font-size: 14px; color: #5A7A85; margin-top: 20px;">
          You can accept or reject this quote from your quotes page.
        </p>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Quote Received

Hi ${clientName || 'there'},

${vendorBusinessName || 'Your vendor'} has sent you a quote${revisionNumber && revisionNumber > 1 ? ' (Revision #' + revisionNumber + ')' : ''}.

Quote Summary:
${quoteAmount ? `Amount: R${quoteAmount.toLocaleString()}\n` : ''}
${quoteDescription ? `Description: ${quoteDescription}\n` : ''}

View and respond to your quote:
https://funcxon.com/quotes

- Funcxon Team
  `;

  return { subject, htmlContent, textContent };
}

function generateQuoteAcceptedToVendorEmail(payload: NotificationPayload) {
  const { vendorBusinessName, clientName, quoteAmount } = payload;
  const subject = `Quote Accepted by ${clientName || 'Client'}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Quote Accepted</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #2B3840; max-width: 600px; margin: 0 auto; padding: 20px; background: #F8F6F0;">
      <div style="background: linear-gradient(135deg, #16A34A 0%, #22C55E 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Quote Accepted!</h1>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #D4CFBD; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-bottom: 20px; color: #2B3840;">Great news, ${vendorBusinessName || 'there'}!</p>
        
        <p style="font-size: 16px; margin-bottom: 20px; color: #2B3840;">
          <strong>${clientName || 'A client'}</strong> has accepted your quote${quoteAmount ? ` for <strong>R${quoteAmount.toLocaleString()}</strong>` : ''}.
        </p>
        
        <p style="font-size: 16px; color: #2B3840;">
          The quote is now finalized. You should contact the client to confirm next steps.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://funcxon.com/vendor/quotes" 
             style="background: #16A34A; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            View Finalized Quote
          </a>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Quote Accepted!

Great news, ${vendorBusinessName || 'there'}!

${clientName || 'A client'} has accepted your quote${quoteAmount ? ` for R${quoteAmount.toLocaleString()}` : ''}.

The quote is now finalized. You should contact the client to confirm next steps.

View finalized quote: https://funcxon.com/vendor/quotes

- Funcxon Team
  `;

  return { subject, htmlContent, textContent };
}

function generateQuoteRejectedToVendorEmail(payload: NotificationPayload) {
  const { vendorBusinessName, clientName, clientNotes, quoteAmount } = payload;
  const subject = `Quote Not Accepted - ${clientName || 'Client Response'}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Quote Response</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #2B3840; max-width: 600px; margin: 0 auto; padding: 20px; background: #F8F6F0;">
      <div style="background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Quote Not Accepted</h1>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #D4CFBD; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-bottom: 20px; color: #2B3840;">Hi ${vendorBusinessName || 'there'},</p>
        
        <p style="font-size: 16px; margin-bottom: 20px; color: #2B3840;">
          <strong>${clientName || 'The client'}</strong> has decided not to proceed with your quote${quoteAmount ? ` for <strong>R${quoteAmount.toLocaleString()}</strong>` : ''} at this time.
        </p>
        
        ${clientNotes ? `
        <div style="background: #F5F1E8; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #D4CFBD;">
          <h3 style="margin-top: 0; color: #DC2626;">Client Feedback</h3>
          <p style="color: #2B3840;">${clientNotes}</p>
        </div>
        ` : ''}
        
        <p style="font-size: 16px; color: #2B3840;">
          Don't be discouraged! You can submit a revised quote if you'd like to adjust your offer.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://funcxon.com/vendor/quotes" 
             style="background: #2B9EB3; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Submit Revised Quote
          </a>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Quote Not Accepted

Hi ${vendorBusinessName || 'there'},

${clientName || 'The client'} has decided not to proceed with your quote${quoteAmount ? ` for R${quoteAmount.toLocaleString()}` : ''} at this time.

${clientNotes ? `Client Feedback:\n${clientNotes}\n\n` : ''}
Don't be discouraged! You can submit a revised quote if you'd like to adjust your offer.

View quotes: https://funcxon.com/vendor/quotes

- Funcxon Team
  `;

  return { subject, htmlContent, textContent };
}

function generateQuoteRevisedToClientEmail(payload: NotificationPayload) {
  // Similar to quote-created but mentions it's a revision
  const { clientName, vendorBusinessName, quoteAmount, quoteDescription, revisionNumber } = payload;
  const subject = `Revised Quote from ${vendorBusinessName || 'your vendor'}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Revised Quote</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #2B3840; max-width: 600px; margin: 0 auto; padding: 20px; background: #F8F6F0;">
      <div style="background: linear-gradient(135deg, #D97706 0%, #F59E0B 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Revised Quote Available</h1>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #D4CFBD; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-bottom: 20px; color: #2B3840;">Hi ${clientName || 'there'},</p>
        
        <p style="font-size: 16px; margin-bottom: 20px; color: #2B3840;">
          <strong>${vendorBusinessName || 'Your vendor'}</strong> has submitted a revised quote (Revision #${revisionNumber || 2}) based on your feedback.
        </p>
        
        <div style="background: #F5F1E8; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #D4CFBD;">
          <h3 style="margin-top: 0; color: #2B9EB3;">Updated Quote</h3>
          ${quoteAmount ? `<p style="color: #2B3840; font-size: 24px; font-weight: bold; margin: 10px 0;">R${quoteAmount.toLocaleString()}</p>` : ''}
          ${quoteDescription ? `<p style="color: #2B3840;">${quoteDescription}</p>` : ''}
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://funcxon.com/quotes" 
             style="background: #2B9EB3; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Review Revised Quote
          </a>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Revised Quote Available

Hi ${clientName || 'there'},

${vendorBusinessName || 'Your vendor'} has submitted a revised quote (Revision #${revisionNumber || 2}) based on your feedback.

Updated Quote:
${quoteAmount ? `Amount: R${quoteAmount.toLocaleString()}\n` : ''}
${quoteDescription ? `Description: ${quoteDescription}\n` : ''}

Review and respond:
https://funcxon.com/quotes

- Funcxon Team
  `;

  return { subject, htmlContent, textContent };
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
          <a href="https://funcxon.com/quotes" 
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

View quote: https://funcxon.com/quotes

- Funcxon Team
  `;

  return { subject, htmlContent, textContent };
}
