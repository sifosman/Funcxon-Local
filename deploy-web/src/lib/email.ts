import { supabase } from './supabaseClient';

interface SendVendorWelcomeEmailParams {
  email: string;
  fullName: string;
  businessName?: string;
  tierName: string;
  applicationUrl: string;
}

export async function sendVendorWelcomeEmail({
  email,
  fullName,
  businessName,
  tierName,
  applicationUrl,
}: SendVendorWelcomeEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.functions.invoke('send-vendor-welcome-email', {
      body: {
        email,
        fullName,
        businessName,
        tierName,
        applicationUrl,
      },
    });

    if (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Exception sending welcome email:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
