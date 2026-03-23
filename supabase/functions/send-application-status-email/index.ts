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

    if (!brevoApiKey) {
      throw new Error('BREVO_API_KEY environment variable is not set');
    }

    const { email, fullName, businessName, tierName, applicationUrl }: EmailRequest = await req.json();

    if (!email || !fullName || !tierName || !applicationUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, fullName, tierName, applicationUrl' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const subject = 'Your Funcxon application has been submitted';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Application Submitted</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #2B3840; max-width: 600px; margin: 0 auto; padding: 20px; background: #F8F6F0;">
        <div style="background: linear-gradient(135deg, #2B9EB3 0%, #9DCFDB 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Application Submitted</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #D4CFBD; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px; color: #2B3840;">Hi ${fullName},</p>
          <p style="font-size: 16px; margin-bottom: 20px; color: #2B3840;">
            Your ${businessName ? `<strong>${businessName}</strong> ` : ''}application for the <strong>${tierName}</strong> package has been submitted successfully.
          </p>
          <div style="background: #F5F1E8; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #D4CFBD;">
            <h3 style="margin-top: 0; color: #2B9EB3;">What happens next?</h3>
            <p style="margin-bottom: 0; color: #2B3840;">Our team will review your application within 12 to 24 hours. While it is pending, you will not be able to edit or resubmit it.</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${applicationUrl}" style="background: #2B9EB3; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              View Application Status
            </a>
          </div>
          <p style="font-size: 14px; color: #5A7A85;">If the button does not open, copy this link into your device browser: <a href="${applicationUrl}" style="color: #2B9EB3;">${applicationUrl}</a></p>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Your Funcxon application has been submitted

Hi ${fullName},

Your ${businessName ? `${businessName} ` : ''}application for the ${tierName} package has been submitted successfully.

Our team will review your application within 12 to 24 hours. While it is pending, you will not be able to edit or resubmit it.

View Application Status: ${applicationUrl}
    `;

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
        Accept: 'application/json',
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
      JSON.stringify({ success: true, message: 'Application status email sent successfully', messageId: brevoResult.messageId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error sending application status email:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send application status email', details: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
