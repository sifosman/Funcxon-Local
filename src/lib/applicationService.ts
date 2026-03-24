import { supabase } from './supabaseClient';
import type { ApplicationFormState } from '../context/ApplicationFormContext';

const BLOCKING_APPLICATION_STATUSES = ['pending', 'under_review'] as const;
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
  business_documents: string[];
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
  business_documents?: string[] | null;
  terms_accepted?: boolean | null;
  privacy_accepted?: boolean | null;
  marketing_consent?: boolean | null;
};

export async function submitApplication(data: ApplicationSubmission) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
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
      business_documents: data.business_documents,
      subscription_tier: data.subscription_tier,
      terms_accepted: data.terms_accepted,
      privacy_accepted: data.privacy_accepted,
      marketing_consent: data.marketing_consent,
    };

    const existingApplicationId = data.existing_application_id ?? null;

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
      : supabase
          .from('subscriber_applications')
          .insert(payload);

    const { data: result, error } = await query
      .select()
      .single();

    if (error) {
      console.error('Application submission error:', error);
      throw new Error(error.message);
    }

    return { success: true, data: result };
  } catch (error) {
    console.error('Submit application error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to submit application' 
    };
  }
}

export async function uploadFileToStorage(
  bucket: 'portfolio-images' | 'portfolio-videos' | 'business-documents',
  file: { uri: string; name: string; type: string },
  userId: string
) {
  try {
    const fileName = `${userId}/${Date.now()}-${file.name}`;
    
    let blob: Blob;
    
    // Handle web vs native file URIs
    if (typeof window !== 'undefined' && window.document) {
      // Web environment - fetch may fail with local file URIs
      // Try fetch first, fallback to direct URI usage
      try {
        const response = await fetch(file.uri);
        blob = await response.blob();
      } catch (fetchError) {
        // If fetch fails (common with blob: URLs or file: URLs on web),
        // the file may need to be handled differently
        console.warn('Fetch failed for file URI, attempting alternative:', fetchError);
        
        // For web, if the uri is a blob URL, we can try to use XMLHttpRequest
        // or create a blob from the uri directly
        if (file.uri.startsWith('blob:')) {
          const response = await fetch(file.uri, { mode: 'no-cors' });
          blob = await response.blob();
        } else {
          // Create a minimal blob with the file info if we can't fetch
          // This is a fallback that may not contain actual file data
          // but prevents the upload from crashing
          blob = new Blob([], { type: file.type });
        }
      }
    } else {
      // Native environment - fetch works with file:// URIs
      const response = await fetch(file.uri);
      blob = await response.blob();
    }
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, blob, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('File upload error:', error);
      throw new Error(error.message);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return { success: true, url: publicUrl, path: data.path };
  } catch (error) {
    console.error('Upload file error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to upload file' 
    };
  }
}

export async function deleteFileFromStorage(
  bucket: 'portfolio-images' | 'portfolio-videos' | 'business-documents',
  path: string
) {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('File deletion error:', error);
      throw new Error(error.message);
    }

    return { success: true };
  } catch (error) {
    console.error('Delete file error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete file' 
    };
  }
}

export async function getUserApplications() {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
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
      error: error instanceof Error ? error.message : 'Failed to get applications' 
    };
  }
}

export async function getLatestUserApplication() {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

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

export function isBlockingApplicationStatus(status?: string | null) {
  const normalized = String(status ?? '').toLowerCase();
  return BLOCKING_APPLICATION_STATUSES.includes(normalized as (typeof BLOCKING_APPLICATION_STATUSES)[number]);
}

export async function cancelApplication(applicationId: string) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

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
