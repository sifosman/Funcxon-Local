import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const BREVO_API_URL = 'https://api.brevo.com/v3';

interface EmailRequest {
  email: string;
  fullName: string;
  signUpMethod?: string;
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
    const fromName = Deno.env.get('FROM_NAME') || 'Funxon Team';

    if (!brevoApiKey) {
      throw new Error('BREVO_API_KEY environment variable is not set');
    }

    const { email, fullName: clientFullName, signUpMethod }: EmailRequest = await req.json();
    let fullName = clientFullName;

    if (!email || !fullName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, fullName' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Idempotency check: use Supabase service role to check/update welcome_email_sent
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (supabaseUrl && serviceRoleKey) {
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

      // Check if welcome email was already sent; also resolve the authoritative full_name
      const { data: userRow, error: userError } = await supabaseAdmin
        .from('users')
        .select('welcome_email_sent, full_name')
        .eq('email', email)
        .maybeSingle();

      if (!userError && userRow?.welcome_email_sent) {
        return new Response(
          JSON.stringify({ success: true, message: 'Welcome email already sent previously, skipping' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Mark as sent
      if (!userError && userRow) {
        await supabaseAdmin
          .from('users')
          .update({ welcome_email_sent: true })
          .eq('email', email);
      }

      // Prefer the DB full_name over the client-provided value
      if (!userError && userRow?.full_name?.trim()) {
        fullName = userRow.full_name.trim();
      }
    }

    const subject = `Welcome to Funxon - Your Event Planning Journey Starts Here!`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Funxon</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f9f9f9;">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #2D5A4C 0%, #4A7C6F 100%); padding: 40px 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 32px; letter-spacing: 1px;">FUNXON</h1>
          <p style="color: #c8e6d8; margin: 8px 0 0; font-size: 16px; letter-spacing: 2px;">CONNECT &middot; COLLABORATE &middot; CELEBRATE</p>
        </div>

        <!-- Body -->
        <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">

          <p style="font-size: 20px; margin-bottom: 20px;">Hi ${fullName},</p>

          <p style="font-size: 16px; margin-bottom: 20px;">
            Welcome to <strong>Funxon</strong> — South Africa's premier event planning platform! We're thrilled to have you on board.
            ${signUpMethod ? `You've successfully signed up using your ${signUpMethod} account,` : 'You\'ve successfully created your account,'}
            and your Funxon journey is now underway.
          </p>

          <p style="font-size: 16px; margin-bottom: 25px;">
            Whether you're planning a wedding, corporate function, birthday celebration, or any special occasion,
            Funxon brings together everything you need to make your event extraordinary — all in one place.
          </p>

          <!-- Features Section -->
          <div style="background: #f5f9f7; border-radius: 10px; padding: 30px; margin: 30px 0;">
            <h2 style="color: #2D5A4C; margin-top: 0; font-size: 22px; text-align: center;">What You Can Do on Funxon</h2>

            <!-- Feature 1 -->
            <div style="display: flex; margin-bottom: 20px; align-items: flex-start;">
              <div style="background: #2D5A4C; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 15px;">
                <span style="color: white; font-size: 18px; font-weight: bold;">1</span>
              </div>
              <div>
                <h3 style="color: #2D5A4C; margin: 0 0 5px; font-size: 17px;">Discover Venues &amp; Vendors</h3>
                <p style="margin: 0; font-size: 15px; color: #555;">Browse our extensive directory of venues and service providers across South Africa. Filter by location, category, and price range to find exactly what you need.</p>
              </div>
            </div>

            <!-- Feature 2 -->
            <div style="display: flex; margin-bottom: 20px; align-items: flex-start;">
              <div style="background: #2D5A4C; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 15px;">
                <span style="color: white; font-size: 18px; font-weight: bold;">2</span>
              </div>
              <div>
                <h3 style="color: #2D5A4C; margin: 0 0 5px; font-size: 17px;">Plan with the Smart Planner</h3>
                <p style="margin: 0; font-size: 15px; color: #555;">Use our built-in event planner to organise your timeline, track your budget in Rand, manage your guest list, and keep all your event details in one convenient place.</p>
              </div>
            </div>

            <!-- Feature 3 -->
            <div style="display: flex; margin-bottom: 20px; align-items: flex-start;">
              <div style="background: #2D5A4C; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 15px;">
                <span style="color: white; font-size: 18px; font-weight: bold;">3</span>
              </div>
              <div>
                <h3 style="color: #2D5A4C; margin: 0 0 5px; font-size: 17px;">Request Catalogues &amp; Quotes</h3>
                <p style="margin: 0; font-size: 15px; color: #555;">View detailed catalogues from vendors and venues, request quotes, and compare offerings side by side — all without leaving the app.</p>
              </div>
            </div>

            <!-- Feature 4 -->
            <div style="display: flex; margin-bottom: 20px; align-items: flex-start;">
              <div style="background: #2D5A4C; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 15px;">
                <span style="color: white; font-size: 18px; font-weight: bold;">4</span>
              </div>
              <div>
                <h3 style="color: #2D5A4C; margin: 0 0 5px; font-size: 17px;">Explore the Listers Portal</h3>
                <p style="margin: 0; font-size: 15px; color: #555;">Are you a vendor or venue owner? The Listers Portal lets you showcase your services, manage your portfolio, receive enquiries, and grow your business.</p>
              </div>
            </div>

            <!-- Feature 5 -->
            <div style="display: flex; margin-bottom: 0; align-items: flex-start;">
              <div style="background: #2D5A4C; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 15px;">
                <span style="color: white; font-size: 18px; font-weight: bold;">5</span>
              </div>
              <div>
                <h3 style="color: #2D5A4C; margin: 0 0 5px; font-size: 17px;">Save Favourites &amp; Share</h3>
                <p style="margin: 0; font-size: 15px; color: #555;">Bookmark your favourite venues and vendors for quick access later, and share profiles with friends, family, or colleagues directly from the app.</p>
              </div>
            </div>
          </div>

          <!-- CTA -->
          <div style="text-align: center; margin: 35px 0;">
            <a href="https://funxon.co.za"
               style="background: #2D5A4C; color: white; padding: 16px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">
              Start Exploring Funxon
            </a>
          </div>

          <!-- Tips Section -->
          <div style="background: #fdf6e3; border-left: 4px solid #f59e0b; padding: 20px 25px; border-radius: 5px; margin: 30px 0;">
            <h3 style="color: #92400e; margin-top: 0; font-size: 16px;">Quick Tips to Get Started</h3>
            <ul style="margin: 0; padding-left: 20px; color: #555; font-size: 15px;">
              <li style="margin-bottom: 8px;">Complete your profile in the Account section for a personalised experience.</li>
              <li style="margin-bottom: 8px;">Use the Discover screen to find venues and vendors near you.</li>
              <li style="margin-bottom: 8px;">Set up your event in the Planner to start tracking your budget and timeline.</li>
              <li>Interested in listing your services? Visit the Listers Portal to get started.</li>
            </ul>
          </div>

          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

          <!-- Support -->
          <p style="font-size: 15px; color: #666; margin-bottom: 8px;">
            Have questions? We're here to help! Contact us at
            <a href="mailto:support@funxon.co.za" style="color: #2D5A4C; font-weight: bold;">support@funxon.co.za</a>
          </p>

          <p style="font-size: 15px; color: #666; margin-bottom: 8px;">
            Follow us on social media for tips, inspiration, and updates:
          </p>
          <p style="font-size: 15px; color: #666; margin-bottom: 20px;">
            <a href="https://www.facebook.com/funxon" style="color: #2D5A4C; margin-right: 15px;">Facebook</a>
            <a href="https://www.instagram.com/funxon" style="color: #2D5A4C; margin-right: 15px;">Instagram</a>
            <a href="https://www.linkedin.com/company/funxon" style="color: #2D5A4C;">LinkedIn</a>
          </p>

          <p style="font-size: 14px; color: #999; margin-top: 25px; text-align: center;">
            You're receiving this email because you signed up for a Funxon account.
          </p>

          <p style="font-size: 16px; color: #2D5A4C; margin-top: 15px; font-weight: bold;">
            The Funxon Team
          </p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 20px 30px; font-size: 12px; color: #999;">
          <p>&copy; 2026 Funxon. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Welcome to Funxon — Your Event Planning Journey Starts Here!

Hi ${fullName},

Welcome to Funxon — South Africa's premier event planning platform! We're thrilled to have you on board.
${signUpMethod ? `You've successfully signed up using your ${signUpMethod} account,` : "You've successfully created your account,"}
and your Funxon journey is now underway.

Whether you're planning a wedding, corporate function, birthday celebration, or any special occasion,
Funxon brings together everything you need to make your event extraordinary — all in one place.

WHAT YOU CAN DO ON FUNXON:

1. Discover Venues & Vendors
   Browse our extensive directory of venues and service providers across South Africa. Filter by location, category, and price range to find exactly what you need.

2. Plan with the Smart Planner
   Use our built-in event planner to organise your timeline, track your budget in Rand, manage your guest list, and keep all your event details in one convenient place.

3. Request Catalogues & Quotes
   View detailed catalogues from vendors and venues, request quotes, and compare offerings side by side — all without leaving the app.

4. Explore the Listers Portal
   Are you a vendor or venue owner? The Listers Portal lets you showcase your services, manage your portfolio, receive enquiries, and grow your business.

5. Save Favourites & Share
   Bookmark your favourite venues and vendors for quick access later, and share profiles with friends, family, or colleagues directly from the app.

QUICK TIPS TO GET STARTED:
- Complete your profile in the Account section for a personalised experience.
- Use the Discover screen to find venues and vendors near you.
- Set up your event in the Planner to start tracking your budget and timeline.
- Interested in listing your services? Visit the Listers Portal to get started.

Start exploring: https://funxon.co.za

Have questions? Contact us at support@funxon.co.za

Follow us on social media:
Facebook: https://www.facebook.com/funxon
Instagram: https://www.instagram.com/funxon
LinkedIn: https://www.linkedin.com/company/funxon

You're receiving this email because you signed up for a Funxon account.

The Funxon Team
© 2026 Funxon. All rights reserved.
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
    console.error('Error sending attendee welcome email:', error);

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
