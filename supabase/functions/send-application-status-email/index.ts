import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const BREVO_API_URL = 'https://api.brevo.com/v3';

interface EmailRequest {
  email: string;
  fullName: string;
  businessName?: string;
  tierName: string;
  applicationUrl: string;
  status?: string;
  adminNotes?: string;
}

interface BrevoEmailPayload {
  sender: { name: string; email: string };
  to: { email: string; name: string }[];
  subject: string;
  htmlContent: string;
  textContent: string;
}

type EmailTemplate = {
  subject: string;
  heading: string;
  intro: string;
  nextSteps: string;
  buttonLabel: string;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getEmailTemplate = (status: string): EmailTemplate => {
  switch (status) {
    case 'approved':
      return {
        subject: 'Your Funcxon application has been approved',
        heading: 'Application Approved',
        intro: 'Great news. Your application has been approved successfully.',
        nextSteps: 'You can now open the app to view your application status and continue with your Funcxon account.',
        buttonLabel: 'Open Application Status',
      };
    case 'needs_changes':
      return {
        subject: 'Changes requested for your Funcxon application',
        heading: 'Changes Requested',
        intro: 'Our team reviewed your application and requested a few changes before approval.',
        nextSteps: 'Open your application status to review the latest update and follow the guidance from the Funcxon team before submitting again.',
        buttonLabel: 'Review Application Update',
      };
    case 'rejected':
      return {
        subject: 'Your Funcxon application was not approved',
        heading: 'Application Not Approved',
        intro: 'We reviewed your application and it was not approved at this time.',
        nextSteps: 'Open your application status to review the update. If you still want to join Funcxon, you can start a new application when you are ready.',
        buttonLabel: 'View Application Status',
      };
    case 'cancelled':
      return {
        subject: 'Your Funcxon application has been cancelled',
        heading: 'Application Cancelled',
        intro: 'Your application has been cancelled and will no longer be reviewed by our team.',
        nextSteps: 'Open your application status if you want to confirm the cancellation or start a new application later.',
        buttonLabel: 'View Application Status',
      };
    case 'under_review':
      return {
        subject: 'Your Funcxon application is under review',
        heading: 'Application Under Review',
        intro: 'Your application is currently under review by the Funcxon team.',
        nextSteps: 'You can open your application status at any time to check for the latest progress.',
        buttonLabel: 'View Application Status',
      };
    case 'submitted':
    case 'pending':
    default:
      return {
        subject: 'Your Funcxon application has been submitted',
        heading: 'Application Submitted',
        intro: 'Your application has been submitted successfully.',
        nextSteps: 'Our team will review your application within 12 to 24 hours. While it is pending, you will not be able to edit or resubmit it.',
        buttonLabel: 'View Application Status',
      };
  }
};

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

    const { email, fullName, businessName, tierName, applicationUrl, status, adminNotes }: EmailRequest = await req.json();

    if (!email || !fullName || !tierName || !applicationUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, fullName, tierName, applicationUrl' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const emailTemplate = getEmailTemplate(String(status || 'submitted').toLowerCase());
    const safeFullName = escapeHtml(fullName);
    const safeBusinessName = businessName ? escapeHtml(businessName) : '';
    const safeTierName = escapeHtml(tierName);
    const safeApplicationUrl = escapeHtml(applicationUrl);
    const safeAdminNotes = adminNotes ? escapeHtml(adminNotes) : '';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${escapeHtml(emailTemplate.heading)}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #2B3840; max-width: 600px; margin: 0 auto; padding: 20px; background: #F8F6F0;">
        <div style="background: linear-gradient(135deg, #2B9EB3 0%, #9DCFDB 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">${escapeHtml(emailTemplate.heading)}</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #D4CFBD; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px; color: #2B3840;">Hi ${safeFullName},</p>
          ${safeBusinessName ? `<p style="font-size: 16px; margin-bottom: 20px; color: #2B3840;">Business: <strong>${safeBusinessName}</strong></p>` : ''}
          <p style="font-size: 16px; margin-bottom: 20px; color: #2B3840;">Package: <strong>${safeTierName}</strong></p>
          <p style="font-size: 16px; margin-bottom: 20px; color: #2B3840;">
            ${escapeHtml(emailTemplate.intro)}
          </p>
          <div style="background: #F5F1E8; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #D4CFBD;">
            <h3 style="margin-top: 0; color: #2B9EB3;">What happens next?</h3>
            <p style="margin-bottom: 0; color: #2B3840;">${escapeHtml(emailTemplate.nextSteps)}</p>
          </div>
          ${safeAdminNotes ? `<div style="background: #FFF7ED; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #FDBA74;"><h3 style="margin-top: 0; color: #C2410C;">Admin Notes</h3><p style="margin-bottom: 0; color: #2B3840; white-space: pre-wrap;">${safeAdminNotes}</p></div>` : ''}
          <div style="text-align: center; margin: 30px 0;">
            <a href="${safeApplicationUrl}" style="background: #2B9EB3; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              ${escapeHtml(emailTemplate.buttonLabel)}
            </a>
          </div>
          <p style="font-size: 14px; color: #5A7A85;">If the button does not open, copy this link into your device browser: <a href="${safeApplicationUrl}" style="color: #2B9EB3;">${safeApplicationUrl}</a></p>
        </div>
      </body>
      </html>
    `;

    const textContent = `
${emailTemplate.subject}

Hi ${safeFullName},
${businessName ? `
Business: ${safeBusinessName}` : ''}
Package: ${safeTierName}

${emailTemplate.intro}

${emailTemplate.nextSteps}

${emailTemplate.buttonLabel}: ${safeApplicationUrl}
${adminNotes ? `
Admin Notes:
${safeAdminNotes}` : ''}
    `;

    const brevoPayload: BrevoEmailPayload = {
      sender: { name: fromName, email: fromEmail },
      to: [{ email, name: fullName }],
      subject: emailTemplate.subject,
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
