// Follow this setup guide to integrate the @supabase/supabase-js and @sendinblue/client libraries:
// https://deno.land/manual/examples/manage_dependencies
// Then create a `deno.json` file in your functions directory with the following content:
// {
//   "imports": {
//     "@supabase/supabase-js": "https://esm.sh/@supabase/supabase-js@2.49.1",
//     "brevo": "https://esm.sh/@getbrevo/brevo@2.2.0"
//   }
// }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

// Brevo API base URL
const BREVO_API_URL = 'https://api.brevo.com/v3';

interface EmailRequest {
  email: string;
  fullName: string;
  businessName?: string;
  tierName: string;
  applicationUrl: string;
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
    const fromName = Deno.env.get('FROM_NAME') || 'Funcxon Team';

    if (!brevoApiKey) {
      throw new Error('BREVO_API_KEY environment variable is not set');
    }

    // Parse request body
    const { email, fullName, businessName, tierName, applicationUrl }: EmailRequest = await req.json();

    if (!email || !fullName || !tierName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, fullName, tierName' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create email content
    const subject = `Welcome to Funcxon - Complete Your Vendor Application`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Funcxon</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2D5A4C 0%, #4A7C6F 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Funcxon!</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 18px; margin-bottom: 20px;">Hi ${fullName},</p>
          
          <p>Congratulations on choosing the <strong>${tierName}</strong> plan! You're now one step closer to becoming a Funcxon vendor.</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="margin-top: 0; color: #2D5A4C;">What's Next?</h3>
            <p style="margin-bottom: 0;">Complete your vendor application to set up your profile, add your services, and start receiving bookings.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${applicationUrl}" 
               style="background: #2D5A4C; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Complete Your Application
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666;">Or copy and paste this link: <a href="${applicationUrl}" style="color: #2D5A4C;">${applicationUrl}</a></p>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
          
          <p style="font-size: 14px; color: #666; margin-bottom: 5px;">Need help? Contact us at <a href="mailto:support@funcxon.com" style="color: #2D5A4C;">support@funcxon.com</a></p>
          <p style="font-size: 14px; color: #666; margin-top: 5px;">The Funcxon Team</p>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Welcome to Funcxon!

Hi ${fullName},

Congratulations on choosing the ${tierName} plan! You're now one step closer to becoming a Funcxon vendor.

What's Next?
Complete your vendor application to set up your profile, add your services, and start receiving bookings.

Complete Your Application: ${applicationUrl}

Need help? Contact us at support@funcxon.com

The Funcxon Team
    `;

    // Send email via Brevo API
    const brevoPayload: BrevoEmailPayload = {
      sender: { name: fromName, email: fromEmail },
      to: [{ email, name: fullName }],
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
        message: 'Welcome email sent successfully',
        messageId: brevoResult.messageId 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error sending welcome email:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send welcome email', 
        details: error instanceof Error ? error.message : String(error) 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
