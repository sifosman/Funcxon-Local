// WEB ONLY — deploy-web/src/lib/applicationService.ts
import { supabase } from './supabaseClient';
import type { ApplicationFormState } from '../context/ApplicationFormContext';

// Helper function to convert base64 data URI to blob
function base64ToBlob(base64: string, mimeType: string): Blob {
  const base64Data = base64.split(',')[1]; // Remove data URL prefix
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

// Resolve a web file value into a Blob we can upload.
async function resolveFileBody(file: { uri: string; name: string; type: string } | File): Promise<Blob> {
  if (file instanceof File) {
    return file;
  }

  const { uri, type } = file;

  if (uri.startsWith('data:')) {
    return base64ToBlob(uri, type);
  }

  if (uri.startsWith('blob:')) {
    const response = await fetch(uri);
    return response.blob();
  }

  // Fallback: treat as a URL and fetch it
  const response = await fetch(uri);
  return response.blob();
}

const BLOCKING_APPLICATION_STATUSES: readonly string[] = ['pending', 'approved', 'under_review', 'needs_changes'];
const EDITABLE_APPLICATION_STATUSES = ['needs_changes'] as const;

export type ApplicationSubmission = {
  existing_application_id?: string | null;
  portfolio_type: 'venue' | 'vendor';
  company_details: ApplicationFormState['step1'];
  service_categories: ApplicationFormState['step2'];
  coverage_provinces: string[];
  coverage_cities: string[];
  business_description: string;
  portfolio_images: string[];
  portfolio_videos: string[];
  subscription_tier: string;
  terms_accepted: boolean;
  privacy_accepted: boolean;
  marketing_consent: boolean;
};

export type SubscriberApplication = {
  id: string;
  user_id: string;
  portfolio_type: 'venue' | 'vendor';
  subscription_tier: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  company_details?: ApplicationFormState['step1'] | null;
  service_categories?: ApplicationFormState['step2'] | null;
  coverage_provinces?: string[] | null;
  coverage_cities?: string[] | null;
  business_description?: string | null;
  portfolio_images?: string[] | null;
  portfolio_videos?: string[] | null;
  terms_accepted?: boolean | null;
  privacy_accepted?: boolean | null;
  marketing_consent?: boolean | null;
};

export async function submitApplication(data: ApplicationSubmission) {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const payload = {
      user_id: user.id,
      portfolio_type: data.portfolio_type,
      company_details: data.company_details,
      service_categories: data.service_categories,
      coverage_provinces: data.coverage_provinces,
      coverage_cities: data.coverage_cities,
      business_description: data.business_description,
      portfolio_images: data.portfolio_images,
      portfolio_videos: data.portfolio_videos,
      subscription_tier: data.subscription_tier,
      terms_accepted: data.terms_accepted,
      privacy_accepted: data.privacy_accepted,
      marketing_consent: data.marketing_consent,
      status: 'pending',
    };

    const existingApplicationId = data.existing_application_id ?? null;

    // Prevent duplicate approved applications for the same portfolio type
    if (!existingApplicationId) {
      const { data: existingApproved, error: existingApprovedError } = await supabase
        .from('subscriber_applications')
        .select('id')
        .eq('user_id', user.id)
        .eq('portfolio_type', data.portfolio_type)
        .eq('status', 'approved')
        .maybeSingle();

      if (existingApprovedError) {
        console.error('Existing approved application check error:', existingApprovedError);
        throw new Error('Failed to verify application status');
      }

      if (existingApproved) {
        throw new Error(`You already have an approved ${data.portfolio_type} application. You cannot submit another one.`);
      }
    }

    const query = existingApplicationId
      ? supabase
          .from('subscriber_applications')
          .update({
            ...payload,
            status: 'pending',
            admin_notes: null,
            reviewed_at: null,
            reviewed_by: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingApplicationId)
          .eq('user_id', user.id)
      : supabase.from('subscriber_applications').insert(payload);

    const { data: result, error } = await query.select().single();

    if (error) {
      console.error('Application submission error:', error);
      throw new Error(error.message);
    }

    return { success: true, data: result };
  } catch (error) {
    console.error('Submit application error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit application',
    };
  }
}

export async function uploadFileToStorage(
  bucket: 'portfolio-images' | 'portfolio-videos' | 'quote-attachments',
  file: { uri: string; name: string; type: string } | File,
  userId: string,
) {
  try {
    const fileName = `${userId}/${Date.now()}-${file.name}`;

    const fileBody = await resolveFileBody(file);
    const fileSize = fileBody.size;

    console.log(`Created fileBody of size ${fileSize} bytes for file ${file.name}`);

    if (fileSize === 0) {
      console.error('File body is empty, upload will fail:', { fileName: file.name, fileType: file.type });
      throw new Error(`File appears to be empty or could not be read: ${file.name}`);
    }

    const { data, error } = await supabase.storage.from(bucket).upload(fileName, fileBody, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });

    if (error) {
      console.error('Supabase storage upload error:', error);
      console.error('Upload details:', { bucket, fileName, fileSize, fileType: file.type });
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    console.log(`Successfully uploaded file to path: ${data.path}`);

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(fileName);

    console.log(`Generated public URL: ${publicUrl}`);

    return { success: true, url: publicUrl, path: data.path };
  } catch (error) {
    console.error('Upload file error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload file',
    };
  }
}

export async function deleteFileFromStorage(
  bucket: 'portfolio-images' | 'portfolio-videos' | 'quote-attachments',
  path: string,
) {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      console.error('File deletion error:', error);
      throw new Error(error.message);
    }

    return { success: true };
  } catch (error) {
    console.error('Delete file error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete file',
    };
  }
}

export async function getUserApplications() {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('subscriber_applications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get applications error:', error);
      throw new Error(error.message);
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Get applications error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get applications',
    };
  }
}

export async function getLatestUserApplication() {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('subscriber_applications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle<SubscriberApplication>();

    if (error) {
      console.error('Get latest application error:', error);
      throw new Error(error.message);
    }

    return { success: true, data: data ?? null };
  } catch (error) {
    console.error('Get latest application error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get latest application',
    };
  }
}

export async function getLatestUserApplicationByType(portfolioType: 'venue' | 'vendor') {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('subscriber_applications')
      .select('*')
      .eq('user_id', user.id)
      .eq('portfolio_type', portfolioType)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle<SubscriberApplication>();

    if (error) {
      console.error('Get latest application by type error:', error);
      throw new Error(error.message);
    }

    return { success: true, data: data ?? null };
  } catch (error) {
    console.error('Get latest application by type error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get latest application',
    };
  }
}

export async function updateUserRoleToVendor() {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { error: dbError } = await supabase.from('users').update({ role: 'vendor' }).eq('auth_user_id', user.id);

    if (dbError) {
      console.error('Update users role error:', dbError);
      throw dbError;
    }

    const { error: metadataError } = await supabase.auth.updateUser({
      data: { role: 'vendor' },
    });

    if (metadataError) {
      console.error('Update auth metadata error:', metadataError);
      throw metadataError;
    }

    return { success: true };
  } catch (error) {
    console.error('Update user role to vendor error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user role',
    };
  }
}

export function isBlockingApplicationStatus(status?: string | null) {
  const normalized = String(status ?? '').toLowerCase();
  return BLOCKING_APPLICATION_STATUSES.includes(normalized as (typeof BLOCKING_APPLICATION_STATUSES)[number]);
}

export function isEditableApplicationStatus(status?: string | null) {
  const normalized = String(status ?? '').toLowerCase();
  return EDITABLE_APPLICATION_STATUSES.includes(normalized as (typeof EDITABLE_APPLICATION_STATUSES)[number]);
}

export async function cancelApplication(applicationId: string) {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('subscriber_applications')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId)
      .eq('user_id', user.id)
      .select('*')
      .maybeSingle<SubscriberApplication>();

    if (error) {
      console.error('Cancel application error:', error);
      throw new Error(error.message);
    }

    return { success: true, data: data ?? null };
  } catch (error) {
    console.error('Cancel application error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel application',
    };
  }
}
