import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Check, Upload, X, Video } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { uploadFileToStorage } from '../lib/applicationService';
import { createGalleryMediaRecord } from '../lib/mediaUpload';
import { getVendorPhotoLimit, getVendorVideoLimit } from '../lib/subscription';
import { AddressAutocompleteInput } from '../components/AddressAutocompleteInput';
import { AppAlert } from '../components/AppAlert';
import { normalizePhoneNumber } from '../utils/phoneNormalization';

export default function UpdateVendorPortfolioPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [photoLimit, setPhotoLimit] = useState(8);
  const [videoLimit, setVideoLimit] = useState(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [additionalPhotos, setAdditionalPhotos] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [alert, setAlert] = useState<{ title: string; message: string; type: 'error' | 'success' | 'warning' } | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    location: '',
    address_line_1: '',
    address_line_2: '',
    suburb: '',
    city: '',
    province: '',
    postal_code: '',
    email: '',
    whatsapp_number: '',
    website_url: '',
    instagram_url: '',
  });

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      try {
        const { data } = await supabase.from('vendors').select('*').eq('user_id', user.id).maybeSingle();
        if (data) {
          setVendorId(data.id);
          setImageUrl(data.image_url || null);
          setAdditionalPhotos(data.additional_photos || []);
          const limit = await getVendorPhotoLimit(data.id);
          setPhotoLimit(limit);
          const videoLimit = await getVendorVideoLimit(data.id);
          setVideoLimit(videoLimit);
          const { data: galleryRows } = await supabase
            .from('gallery_media')
            .select('media_url, media_type')
            .eq('vendor_id', data.id);
          setVideos((galleryRows || []).filter((g) => g.media_type === 'video').map((g) => g.media_url));
          setForm({
            name: data.name || '',
            description: data.description || '',
            location: data.location || '',
            address_line_1: data.address_line_1 || '',
            address_line_2: data.address_line_2 || '',
            suburb: data.suburb || '',
            city: data.city || '',
            province: data.province || '',
            postal_code: data.postal_code || '',
            email: data.email || '',
            whatsapp_number: data.whatsapp_number || '',
            website_url: data.website_url || '',
            instagram_url: data.instagram_url || '',
          });
        }
      } catch (err) {
        console.error('Failed to load vendor:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const handleChange = (key: keyof typeof form, value: string) => {
    const isPhoneField = key === 'whatsapp_number';
    const normalizedValue = isPhoneField ? normalizePhoneNumber(value) : value;
    setForm((prev) => ({ ...prev, [key]: normalizedValue }));
  };

  const currentPhotoCount = (imageUrl ? 1 : 0) + additionalPhotos.length;
  const remainingPhotoSlots = Math.max(0, photoLimit - currentPhotoCount);
  const currentVideoCount = videos.length;
  const remainingVideoSlots = Math.max(0, videoLimit - currentVideoCount);

  const handleImageUpload = async (files: FileList | null, isMain: boolean) => {
    if (!files || files.length === 0 || !user?.id) return;
    setUploadingImage(true);
    try {
      const uploads: string[] = [];
      const toUpload = Array.from(files).slice(0, isMain ? 1 : remainingPhotoSlots);
      for (const file of toUpload) {
        const result = await uploadFileToStorage('portfolio-images', file, user.id);
        if (result.success && result.url) {
          uploads.push(result.url);
          if (vendorId) {
            await createGalleryMediaRecord(result.url, 'image', { vendorId });
          }
        }
      }
      if (isMain) {
        setImageUrl(uploads[0] || imageUrl);
      } else {
        setAdditionalPhotos((prev) => [...prev, ...uploads]);
      }
    } catch (err: any) {
      setAlert({ title: 'Upload Failed', message: err?.message || 'Could not upload image(s).', type: 'error' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveMainImage = () => setImageUrl(null);
  const handleRemoveAdditionalPhoto = (index: number) => setAdditionalPhotos((prev) => prev.filter((_, i) => i !== index));
  const handleRemoveVideo = (index: number) => setVideos((prev) => prev.filter((_, i) => i !== index));

  const handleVideoUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !user?.id || !vendorId) return;
    setUploadingVideo(true);
    try {
      const uploads: string[] = [];
      const toUpload = Array.from(files).slice(0, remainingVideoSlots);
      for (const file of toUpload) {
        const result = await uploadFileToStorage('portfolio-videos', file, user.id);
        if (result.success && result.url) {
          uploads.push(result.url);
          await createGalleryMediaRecord(result.url, 'video', { vendorId });
        }
      }
      setVideos((prev) => [...prev, ...uploads]);
    } catch (err: any) {
      setAlert({ title: 'Upload Failed', message: err?.message || 'Could not upload video(s).', type: 'error' });
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setAlert({ title: 'Required', message: 'Business name is required.', type: 'error' });
      return;
    }
    if (!user?.id) return;
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        name: form.name.trim(),
        description: form.description.trim() || null,
        location: form.location.trim() || null,
        address_line_1: form.address_line_1.trim() || null,
        address_line_2: form.address_line_2.trim() || null,
        suburb: form.suburb.trim() || null,
        city: form.city.trim() || null,
        province: form.province.trim() || null,
        postal_code: form.postal_code.trim() || null,
        email: form.email.trim() || null,
        whatsapp_number: form.whatsapp_number.trim() || null,
        website_url: form.website_url.trim() || null,
        instagram_url: form.instagram_url.trim() || null,
        image_url: imageUrl,
        additional_photos: additionalPhotos.length > 0 ? additionalPhotos : null,
      };
      const { error } = await supabase.from('vendors').upsert(payload, { onConflict: 'user_id' });
      if (error) throw error;
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        navigate('/lister-portfolio');
      }, 800);
    } catch (err: any) {
      console.error('Vendor portfolio update error:', err);
      setAlert({ title: 'Error', message: err?.message || 'Failed to save changes.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fx-container py-20 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const fields: { key: keyof typeof form; label: string; type?: string; required?: boolean }[] = [
    { key: 'name', label: 'Business Name', required: true },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'whatsapp_number', label: 'WhatsApp Number' },
    { key: 'website_url', label: 'Website URL' },
    { key: 'instagram_url', label: 'Instagram URL' },
  ];

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-3xl">
        {alert && <AppAlert visible={true} title={alert.title} message={alert.message} type={alert.type} onDismiss={() => setAlert(null)} />}
        <Link
          to="/lister-portfolio"
          className="mb-4 inline-flex items-center text-sm font-medium hover:underline"
          style={{ color: '#123f5c' }}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Portfolio
        </Link>

        <h1 className="mb-2 text-3xl font-bold" style={{ color: '#123f5c' }}>
          Update Vendor Portfolio
        </h1>
        <p className="mb-6 text-sm" style={{ color: '#72787e' }}>
          Edit your business details and contact information.
        </p>

        <div className="space-y-6">
          {/* Main image */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant" >
              Main Image
            </label>
            <div className="rounded-lg border border-dashed border-outline-variant p-6 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e.target.files, true)}
                className="hidden"
                id="vendor-main-image"
                disabled={uploadingImage}
              />
              <label
                htmlFor="vendor-main-image"
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-outline-variant bg-white px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-low disabled:opacity-60"
              >
                <Upload className="h-4 w-4" />
                {uploadingImage ? 'Uploading...' : 'Upload Main Image'}
              </label>
            </div>
            {imageUrl && (
              <div className="relative mt-3 max-w-xs rounded-lg border border-outline-variant p-1">
                <img src={imageUrl} alt="Main" className="aspect-square w-full rounded-md object-cover" />
                <button
                  type="button"
                  onClick={handleRemoveMainImage}
                  className="absolute right-1 top-1 rounded-full bg-white p-1 shadow"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          {/* Additional photos */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant" >
              Portfolio Photos <span className="font-normal normal-case">({currentPhotoCount} of {photoLimit} used. Your current subscription allows up to {photoLimit} photos.)</span>
            </label>
            <div className="rounded-lg border border-dashed border-outline-variant p-6 text-center">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleImageUpload(e.target.files, false)}
                className="hidden"
                id="vendor-additional-photos"
                disabled={uploadingImage || remainingPhotoSlots <= 0}
              />
              <label
                htmlFor="vendor-additional-photos"
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-outline-variant bg-white px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-low disabled:opacity-60"
              >
                <Upload className="h-4 w-4" />
                {uploadingImage ? 'Uploading...' : 'Add Photos'}
              </label>
            </div>
            {additionalPhotos.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                {additionalPhotos.map((url, i) => (
                  <div key={i} className="relative rounded-lg border border-outline-variant p-1">
                    <img src={url} alt="" className="aspect-square w-full rounded-md object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveAdditionalPhoto(i)}
                      className="absolute right-1 top-1 rounded-full bg-white p-1 shadow"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Videos */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant" >
              Portfolio Videos <span className="font-normal normal-case">({currentVideoCount} of {videoLimit})</span>
            </label>
            <div className="rounded-lg border border-dashed border-outline-variant p-6 text-center">
              <input
                type="file"
                accept="video/*"
                onChange={(e) => handleVideoUpload(e.target.files)}
                className="hidden"
                id="vendor-video-upload"
                disabled={uploadingVideo || remainingVideoSlots <= 0}
              />
              <label
                htmlFor="vendor-video-upload"
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-outline-variant bg-white px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-low disabled:opacity-60"
              >
                <Video className="h-4 w-4" />
                {uploadingVideo ? 'Uploading...' : 'Upload Video'}
              </label>
            </div>
            <div className="mt-3 space-y-2">
              {videos.map((_, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-outline-variant p-3">
                  <span className="text-sm">Video {i + 1}</span>
                  <button type="button" onClick={() => handleRemoveVideo(i)} className="text-on-surface-variant"><X className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {fields.map((field) => (
              <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant" >
                  {field.label}{field.required ? ' *' : ''}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={form[field.key]}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-outline-variant px-4 py-3 text-sm outline-none focus:border-primary"
                    
                  />
                ) : (
                  <input
                    type={field.type || 'text'}
                    value={form[field.key]}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className="w-full rounded-lg border border-outline-variant px-4 py-3 text-sm outline-none focus:border-primary"
                    
                  />
                )}
              </div>
            ))}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant" >Location</label>
            <AddressAutocompleteInput
              label=""
              placeholder="Search address"
              value={form.location}
              onChangeValue={(value) => handleChange('location', value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {(['address_line_1', 'address_line_2', 'suburb', 'city', 'province', 'postal_code'] as const).map((key) => (
              <div key={key}>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant" >
                  {key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </label>
                <input
                  type="text"
                  value={form[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="w-full rounded-lg border border-outline-variant px-4 py-3 text-sm outline-none focus:border-primary"
                  
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between">
          <Link
            to="/lister-portfolio"
            className="rounded-lg border border-outline-variant px-6 py-3 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
            
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            style={{ background: '#123f5c' }}
          >
            {saving ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Saving...</span> : saved ? <span className="flex items-center gap-2"><Check className="h-4 w-4" /> Saved</span> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
