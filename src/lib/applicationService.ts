import { supabase } from './supabaseClient';
import type { ApplicationFormState } from '../context/ApplicationFormContext';

export type ApplicationSubmission = {
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

export async function submitApplication(data: ApplicationSubmission) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { data: result, error } = await supabase
      .from('subscriber_applications')
      .insert({
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
      })
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
    
    // Convert file URI to blob for upload
    const response = await fetch(file.uri);
    const blob = await response.blob();
    
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
