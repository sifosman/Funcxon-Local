// Admin Notification Edge Function
// Sends email notifications to admin for various platform events

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

// Brevo API base URL
const BREVO_API_URL = 'https://api.brevo.com/v3';

// Admin notification types
type NotificationType = 
  | 'vendor-subscription-purchased'
  | 'vendor-application-submitted'
  | 'vendor-free-signup'
  | 'quote-requested'
  | 'portfolio-callback-requested'
  | 'new-user-registered';

interface NotificationPayload {
  type: NotificationType;
  vendorName?: string;
  vendorEmail?: string;
  businessName?: string;
  tierName?: string;
  amount?: number;
  customerName?: string;
  customerEmail?: string;
  serviceCategories?: string[];
  provinces?: string[];
  phoneNumber?: string;
  preferredTime?: string;
  assistanceType?: string;
  eventDetails?: string;
  vendorId?: string;
  quoteDetails?: string;
}

interface BrevoEmailPayload {
  sender: { name: string; email: string };
  to: { email: string; name: string }[];
  subject: string;
  htmlContent: string;
  textContent: string;
}

Deno.serve(async (req: Request) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const brevoApiKey = Deno.env.get('BREVO_API_KEY');
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'noreply@funcxon.com';
    const fromName = Deno.env.get('FROM_NAME') || 'Funcxon Platform';
    const adminEmail = Deno.env.get('ADMIN_EMAIL') || 'admin@funcxon.com';
    const adminName = Deno.env.get('ADMIN_NAME') || 'Funcxon Admin';

    if (!brevoApiKey) {
      throw new Error('BREVO_API_KEY environment variable is not set');
    }

    // Parse request body
    const payload: NotificationPayload = await req.json();

    if (!payload.type) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate email content based on notification type
    const { subject, htmlContent, textContent } = generateEmailContent(payload);

    // Send email via Brevo API
    const brevoPayload: BrevoEmailPayload = {
      sender: { name: fromName, email: fromEmail },
      to: [{ email: adminEmail, name: adminName }],
      subject,
      htmlContent,
      textContent,
    };

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
        message: 'Admin notification sent successfully',
        messageId: brevoResult.messageId,
        type: payload.type,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error sending admin notification:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to send admin notification',
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function generateEmailContent(payload: NotificationPayload): { subject: string; htmlContent: string; textContent: string } {
  const { type } = payload;

  switch (type) {
    case 'vendor-subscription-purchased':
      return generateSubscriptionPurchasedEmail(payload);
    case 'vendor-application-submitted':
      return generateApplicationSubmittedEmail(payload);
    case 'vendor-free-signup':
      return generateFreeSignupEmail(payload);
    case 'quote-requested':
      return generateQuoteRequestedEmail(payload);
    case 'portfolio-callback-requested':
      return generateCallbackRequestedEmail(payload);
    case 'new-user-registered':
      return generateNewUserEmail(payload);
    default:
      return generateGenericEmail(payload);
  }
}

function generateSubscriptionPurchasedEmail(payload: NotificationPayload) {
  const { vendorName, vendorEmail, businessName, tierName, amount } = payload;
  const subject = `New Subscription: ${businessName || vendorName} - ${tierName}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Subscription</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #2D5A4C 0%, #4A7C6F 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">New Subscription Purchased</h1>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-bottom: 20px;">A new vendor has purchased a subscription plan.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="margin-top: 0; color: #2D5A4C;">Vendor Details</h3>
          <p><strong>Name:</strong> ${vendorName || 'N/A'}</p>
          <p><strong>Email:</strong> ${vendorEmail || 'N/A'}</p>
          <p><strong>Business:</strong> ${businessName || 'N/A'}</p>
          <p><strong>Plan:</strong> ${tierName || 'N/A'}</p>
          <p><strong>Amount:</strong> R${amount || '0'}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://funcxon.com/admin/vendors" 
             style="background: #2D5A4C; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            View in Admin Panel
          </a>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
New Subscription Purchased

Vendor Details:
- Name: ${vendorName || 'N/A'}
- Email: ${vendorEmail || 'N/A'}
- Business: ${businessName || 'N/A'}
- Plan: ${tierName || 'N/A'}
- Amount: R${amount || '0'}

View in admin panel: https://funcxon.com/admin/vendors
  `;

  return { subject, htmlContent, textContent };
}

function generateApplicationSubmittedEmail(payload: NotificationPayload) {
  const { vendorName, vendorEmail, businessName, tierName, serviceCategories, provinces } = payload;
  const subject = `New Vendor Application: ${businessName || vendorName}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Application</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #2D5A4C 0%, #4A7C6F 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">New Vendor Application Submitted</h1>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-bottom: 20px;">A new vendor has submitted their application for review.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="margin-top: 0; color: #2D5A4C;">Application Details</h3>
          <p><strong>Name:</strong> ${vendorName || 'N/A'}</p>
          <p><strong>Email:</strong> ${vendorEmail || 'N/A'}</p>
          <p><strong>Business:</strong> ${businessName || 'N/A'}</p>
          <p><strong>Selected Plan:</strong> ${tierName || 'N/A'}</p>
          <p><strong>Categories:</strong> ${serviceCategories?.join(', ') || 'N/A'}</p>
          <p><strong>Coverage:</strong> ${provinces?.join(', ') || 'N/A'}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://funcxon.com/admin/applications" 
             style="background: #2D5A4C; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Review Application
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666;">Please review within 3-5 business days as per SLA.</p>
      </div>
    </body>
    </html>
  `;

  const textContent = `
New Vendor Application Submitted

Application Details:
- Name: ${vendorName || 'N/A'}
- Email: ${vendorEmail || 'N/A'}
- Business: ${businessName || 'N/A'}
- Selected Plan: ${tierName || 'N/A'}
- Categories: ${serviceCategories?.join(', ') || 'N/A'}
- Coverage: ${provinces?.join(', ') || 'N/A'}

Review in admin panel: https://funcxon.com/admin/applications
  `;

  return { subject, htmlContent, textContent };
}

function generateFreeSignupEmail(payload: NotificationPayload) {
  const { vendorName, vendorEmail, businessName, tierName } = payload;
  const subject = `New Free Plan Signup: ${businessName || vendorName}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Free Plan Signup</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #4A7C6F 0%, #6B9B8E 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">New Free Plan Signup</h1>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-bottom: 20px;">A new vendor has signed up for a free plan.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="margin-top: 0; color: #2D5A4C;">Vendor Details</h3>
          <p><strong>Name:</strong> ${vendorName || 'N/A'}</p>
          <p><strong>Email:</strong> ${vendorEmail || 'N/A'}</p>
          <p><strong>Business:</strong> ${businessName || 'N/A'}</p>
          <p><strong>Plan:</strong> ${tierName || 'FREE'}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://funcxon.com/admin/vendors" 
             style="background: #2D5A4C; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            View in Admin Panel
          </a>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
New Free Plan Signup

Vendor Details:
- Name: ${vendorName || 'N/A'}
- Email: ${vendorEmail || 'N/A'}
- Business: ${businessName || 'N/A'}
- Plan: ${tierName || 'FREE'}

View in admin panel: https://funcxon.com/admin/vendors
  `;

  return { subject, htmlContent, textContent };
}

function generateQuoteRequestedEmail(payload: NotificationPayload) {
  const { customerName, customerEmail, vendorName, vendorId, quoteDetails } = payload;
  const subject = `New Quote Request: ${customerName} → ${vendorName}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Quote Request</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #D97706 0%, #F59E0B 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">New Quote Request</h1>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-bottom: 20px;">A customer has requested a quote from a vendor.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="margin-top: 0; color: #D97706;">Customer Details</h3>
          <p><strong>Name:</strong> ${customerName || 'N/A'}</p>
          <p><strong>Email:</strong> ${customerEmail || 'N/A'}</p>
        </div>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="margin-top: 0; color: #2D5A4C;">Vendor Details</h3>
          <p><strong>Name:</strong> ${vendorName || 'N/A'}</p>
          <p><strong>Vendor ID:</strong> ${vendorId || 'N/A'}</p>
        </div>
        
        ${quoteDetails ? `
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="margin-top: 0; color: #333;">Quote Details</h3>
          <p>${quoteDetails}</p>
        </div>
        ` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://funcxon.com/admin/quotes" 
             style="background: #D97706; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            View Quote Requests
          </a>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
New Quote Request

Customer Details:
- Name: ${customerName || 'N/A'}
- Email: ${customerEmail || 'N/A'}

Vendor Details:
- Name: ${vendorName || 'N/A'}
- Vendor ID: ${vendorId || 'N/A'}

${quoteDetails ? `Quote Details:\n${quoteDetails}\n` : ''}

View in admin panel: https://funcxon.com/admin/quotes
  `;

  return { subject, htmlContent, textContent };
}

function generateCallbackRequestedEmail(payload: NotificationPayload) {
  const { vendorName, vendorEmail, phoneNumber, preferredTime, assistanceType } = payload;
  const subject = `Callback Requested: ${vendorName}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Callback Requested</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Portfolio Assistance Callback</h1>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-bottom: 20px;">A vendor has requested a callback for portfolio assistance.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="margin-top: 0; color: #8B5CF6;">Vendor Details</h3>
          <p><strong>Name:</strong> ${vendorName || 'N/A'}</p>
          <p><strong>Email:</strong> ${vendorEmail || 'N/A'}</p>
        </div>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="margin-top: 0; color: #2D5A4C;">Callback Request</h3>
          <p><strong>Phone:</strong> ${phoneNumber || 'N/A'}</p>
          <p><strong>Preferred Time:</strong> ${preferredTime || 'N/A'}</p>
          <p><strong>Assistance Needed:</strong> ${assistanceType || 'N/A'}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://funcxon.com/admin/callbacks" 
             style="background: #8B5CF6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Manage Callbacks
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666; margin-top: 20px;">
          <strong>Reminder:</strong> Response time is within 2 hours during business hours (Mon-Fri 9am-5pm, Sat 9am-1pm).
        </p>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Portfolio Assistance Callback Requested

Vendor Details:
- Name: ${vendorName || 'N/A'}
- Email: ${vendorEmail || 'N/A'}

Callback Request:
- Phone: ${phoneNumber || 'N/A'}
- Preferred Time: ${preferredTime || 'N/A'}
- Assistance Needed: ${assistanceType || 'N/A'}

Manage in admin panel: https://funcxon.com/admin/callbacks

Reminder: Response time is within 2 hours during business hours.
  `;

  return { subject, htmlContent, textContent };
}

function generateNewUserEmail(payload: NotificationPayload) {
  const { vendorName, vendorEmail } = payload;
  const subject = `New User Registered: ${vendorName}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New User</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #6366F1 0%, #818CF8 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">New User Registration</h1>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-bottom: 20px;">A new user has registered on the platform.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="margin-top: 0; color: #6366F1;">User Details</h3>
          <p><strong>Name:</strong> ${vendorName || 'N/A'}</p>
          <p><strong>Email:</strong> ${vendorEmail || 'N/A'}</p>
          <p><strong>Registered:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://funcxon.com/admin/users" 
             style="background: #6366F1; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            View Users
          </a>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
New User Registration

User Details:
- Name: ${vendorName || 'N/A'}
- Email: ${vendorEmail || 'N/A'}
- Registered: ${new Date().toLocaleString()}

View in admin panel: https://funcxon.com/admin/users
  `;

  return { subject, htmlContent, textContent };
}

function generateGenericEmail(payload: NotificationPayload) {
  const subject = `Admin Notification: ${payload.type}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Notification</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #f5f5f5; padding: 30px; border-radius: 10px;">
        <h2 style="color: #2D5A4C;">Admin Notification</h2>
        <p><strong>Type:</strong> ${payload.type}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <pre style="background: #fff; padding: 15px; border-radius: 5px; overflow-x: auto;">${JSON.stringify(payload, null, 2)}</pre>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Admin Notification

Type: ${payload.type}
Time: ${new Date().toLocaleString()}

Payload:
${JSON.stringify(payload, null, 2)}
  `;

  return { subject, htmlContent, textContent };
}
