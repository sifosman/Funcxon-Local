import { supabase } from './supabaseClient';
import type { ApplicationFormState } from '../context/ApplicationFormContext';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

// Helper function to convert blob URL to base64
export async function convertBlobToBase64(blobUrl: string, mimeType: string): Promise<string> {
  try {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to convert blob to base64:', error);
    throw new Error('Failed to process file');
  }
}

// Helper function to convert base64 to blob
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
    console.log(`Starting upload to bucket ${bucket} for user ${userId}:`, { fileName: file.name, fileType: file.type, uri: file.uri });
    
    const fileName = `${userId}/${Date.now()}-${file.name}`;
    
    let fileBody: Blob | ArrayBuffer;
    let fileSize: number;
    
    // Handle different URI types
    if (file.uri.startsWith('data:')) {
      // Base64 data URI - convert to blob
      fileBody = base64ToBlob(file.uri, file.type);
      fileSize = fileBody.size;
    } else if (file.uri.startsWith('blob:')) {
      // Blob URL - convert to base64 first, then to blob
      try {
        const base64 = await convertBlobToBase64(file.uri, file.type);
        fileBody = base64ToBlob(base64, file.type);
        fileSize = fileBody.size;
      } catch (blobError) {
        console.error('Blob URL conversion failed:', blobError);
        throw new Error(`Failed to read blob URL: ${file.uri}`);
      }
    } else {
      // Native file URI - read using expo-file-system as base64
      try {
        const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: 'base64' });
        fileBody = decode(base64);
        fileSize = fileBody.byteLength;
      } catch (nativeFetchError) {
        console.error('Native file read failed for file URI:', file.uri, nativeFetchError);
        throw new Error(`Failed to read native file: ${nativeFetchError instanceof Error ? nativeFetchError.message : String(nativeFetchError)}`);
      }
    }

    console.log(`Created fileBody of size ${fileSize} bytes for file ${file.name} from URI: ${file.uri}`);

    // Check if fileBody is empty (which would cause upload to fail)
    if (fileSize === 0) {
      console.error('File body is empty, upload will fail:', { fileName: file.name, uri: file.uri, fileType: file.type });
      throw new Error(`File appears to be empty or could not be read: ${file.name}`);
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, fileBody, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase storage upload error:', error);
      console.error('Upload details:', { bucket, fileName, fileSize: fileSize, fileType: file.type });
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    console.log(`Successfully uploaded file to path: ${data.path}`);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    console.log(`Generated public URL: ${publicUrl}`);

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
