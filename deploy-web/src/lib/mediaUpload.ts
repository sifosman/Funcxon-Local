import { supabase } from './supabaseClient';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

export type MediaBucket = 'portfolio-images' | 'portfolio-videos' | 'gallery-media' | 'catalogue-items';

export interface MediaFile {
  uri: string;
  name: string;
  type: string;
}

export interface MediaUploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
export const VIDEO_MIME_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];

export function isImage(fileType: string): boolean {
  return IMAGE_MIME_TYPES.includes(fileType.toLowerCase())
    || fileType.toLowerCase().startsWith('image/');
}

export function isVideo(fileType: string): boolean {
  return VIDEO_MIME_TYPES.includes(fileType.toLowerCase())
    || fileType.toLowerCase().startsWith('video/');
}

export function getMediaType(fileType: string): 'image' | 'video' | null {
  if (isImage(fileType)) return 'image';
  if (isVideo(fileType)) return 'video';
  return null;
}

export function pickBucketForMedia(fileType: string): MediaBucket {
  const mediaType = getMediaType(fileType);
  if (mediaType === 'image') return 'portfolio-images';
  if (mediaType === 'video') return 'portfolio-videos';
  return 'portfolio-images';
}

export function buildStoragePath(_bucket: MediaBucket, userId: string, fileName: string): string {
  return `${userId}/${Date.now()}-${fileName}`;
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const base64Data = base64.split(',')[1];
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

async function convertBlobToBase64(blobUrl: string, mimeType: string): Promise<string> {
  const response = await fetch(blobUrl);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function resolveFileBody(file: MediaFile): Promise<Blob | ArrayBuffer> {
  if (file.uri.startsWith('data:')) {
    return base64ToBlob(file.uri, file.type);
  }

  if (file.uri.startsWith('blob:')) {
    const base64 = await convertBlobToBase64(file.uri, file.type);
    return base64ToBlob(base64, file.type);
  }

  const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: 'base64' });
  return decode(base64);
}

export async function uploadMediaFile(
  bucket: MediaBucket,
  file: MediaFile,
  userId: string
): Promise<MediaUploadResult> {
  try {
    const fileName = buildStoragePath(bucket, userId, file.name);
    const fileBody = await resolveFileBody(file);
    const fileSize = fileBody instanceof Blob ? fileBody.size : fileBody.byteLength;

    if (fileSize === 0) {
      throw new Error('File appears to be empty or could not be read');
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, fileBody, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);

    return { success: true, url: publicUrl, path: data.path };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to upload media file';
    console.error('[uploadMediaFile] failed:', message, { bucket, file });
    return { success: false, error: message };
  }
}

export async function deleteMediaFile(
  bucket: MediaBucket,
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      throw new Error(`Storage delete failed: ${error.message}`);
    }
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete media file';
    console.error('[deleteMediaFile] failed:', message, { bucket, path });
    return { success: false, error: message };
  }
}

export function getMediaPublicUrl(bucket: MediaBucket, path: string): string {
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
  return publicUrl;
}

export async function createGalleryMediaRecord(
  mediaUrl: string,
  mediaType: 'image' | 'video',
  owner: { vendorId?: number | null; venueId?: number | null }
): Promise<{ success: boolean; id?: number; error?: string }> {
  try {
    const payload: Record<string, unknown> = {
      media_url: mediaUrl,
      media_type: mediaType,
    };

    if (owner.vendorId) {
      payload.vendor_id = owner.vendorId;
    } else if (owner.venueId) {
      payload.venue_id = owner.venueId;
    } else {
      throw new Error('Either vendorId or venueId must be provided');
    }

    const { data, error } = await supabase
      .from('gallery_media')
      .insert(payload)
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create gallery media record: ${error.message}`);
    }

    return { success: true, id: data?.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create gallery media record';
    console.error('[createGalleryMediaRecord] failed:', message);
    return { success: false, error: message };
  }
}
