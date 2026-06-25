import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, X, Upload, Loader2 } from 'lucide-react';
import { useApplicationForm } from '../context/ApplicationFormContext';
import { validateStep3 } from '../utils/formValidation';
import { uploadFileToStorage } from '../lib/applicationService';
import { ApplicationProgress } from '../components/ApplicationProgress';
import { supabase } from '../lib/supabaseClient';

export default function ApplicationStep3Page() {
  const navigate = useNavigate();
  const { state, updateStep3 } = useApplicationForm();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!state.portfolioType) {
      navigate('/portfolio-type');
      return;
    }
    setLoading(false);
  }, [state.portfolioType, navigate]);

  const uploadFiles = async (
    bucket: 'portfolio-images' | 'portfolio-videos' | 'business-documents',
    files: FileList | null,
    key: 'images' | 'videos' | 'documents',
    namePrefix?: string,
  ) => {
    if (!files || files.length === 0) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    for (const file of Array.from(files)) {
      const id = `${file.name}-${Date.now()}`;
      setUploading((prev) => ({ ...prev, [id]: true }));
      const result = await uploadFileToStorage(bucket, file, user.id);
      setUploading((prev) => ({ ...prev, [id]: false }));
      if (result.success && result.url) {
        const current = state.step3[key];
        const storedName = namePrefix ? `${namePrefix}__${file.name}` : file.name;
        const item = { uri: result.url, name: storedName, type: file.type, size: file.size };
        updateStep3({ [key]: [...current, item] });
      } else {
        setErrors((prev) => ({ ...prev, [key]: `Failed to upload ${file.name}: ${result.error}` }));
      }
    }
  };

  const removeFile = (key: 'images' | 'videos' | 'documents', index: number) => {
    const current = state.step3[key];
    updateStep3({ [key]: current.filter((_, i) => i !== index) });
  };

  const handleNext = () => {
    const result = validateStep3(state.step3);
    setErrors(result.errors);
    if (!result.isValid) return;
    navigate('/apply/step4');
  };

  if (loading) {
    return (
      <div className="fx-container py-20 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/apply/step2"
          className="mb-4 inline-flex items-center text-sm font-medium hover:underline"
          style={{ fontFamily: "'Montserrat', sans-serif", color: '#123f5c' }}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Link>

        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#123f5c' }}>
            Step 3: Portfolio Media
          </h1>
          <ApplicationProgress currentStep={3} />
        </div>

        <div className="space-y-8">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Portfolio Images * <span className="font-normal normal-case">(at least one)</span>
            </label>
            <div className="rounded-lg border border-dashed border-outline-variant p-6 text-center">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => uploadFiles('portfolio-images', e.target.files, 'images')}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90" style={{ fontFamily: "'Montserrat', sans-serif", background: '#123f5c' }}>
                <Upload className="h-4 w-4" /> Upload Images
              </label>
            </div>
            {errors.images && <p className="mt-1 text-xs text-red-500">{errors.images}</p>}
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
              {state.step3.images.map((img, i) => (
                <div key={i} className="relative rounded-lg border border-outline-variant p-1">
                  <img src={img.uri} alt="" className="aspect-square w-full rounded-md object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile('images', i)}
                    className="absolute right-1 top-1 rounded-full bg-white p-1 shadow"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Portfolio Videos
            </label>
            <div className="rounded-lg border border-dashed border-outline-variant p-6 text-center">
              <input
                type="file"
                accept="video/*"
                multiple
                onChange={(e) => uploadFiles('portfolio-videos', e.target.files, 'videos')}
                className="hidden"
                id="video-upload"
              />
              <label htmlFor="video-upload" className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-outline-variant bg-white px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-low" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                <Upload className="h-4 w-4" /> Upload Videos
              </label>
            </div>
            <div className="mt-3 space-y-2">
              {state.step3.videos.map((vid, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-outline-variant p-3">
                  <span className="text-sm" style={{ fontFamily: "'Montserrat', sans-serif" }}>{vid.name}</span>
                  <button type="button" onClick={() => removeFile('videos', i)} className="text-on-surface-variant"><X className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Business Documents * <span className="font-normal normal-case">(ID copy and company logo required)</span>
            </label>
            <div className="grid gap-4 rounded-lg border border-dashed border-outline-variant p-6 md:grid-cols-2">
              <div className="text-center">
                <input
                  type="file"
                  onChange={(e) => uploadFiles('business-documents', e.target.files, 'documents', 'id_copy')}
                  className="hidden"
                  id="id-copy-upload"
                />
                <label htmlFor="id-copy-upload" className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-outline-variant bg-white px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-low" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  <Upload className="h-4 w-4" /> Upload ID Copy
                </label>
              </div>
              <div className="text-center">
                <input
                  type="file"
                  onChange={(e) => uploadFiles('business-documents', e.target.files, 'documents', 'company_logo')}
                  className="hidden"
                  id="logo-upload"
                />
                <label htmlFor="logo-upload" className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-outline-variant bg-white px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-low" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  <Upload className="h-4 w-4" /> Upload Company Logo
                </label>
              </div>
            </div>
            {errors.idCopy && <p className="mt-1 text-xs text-red-500">{errors.idCopy}</p>}
            {errors.companyLogo && <p className="mt-1 text-xs text-red-500">{errors.companyLogo}</p>}
            <div className="mt-3 space-y-2">
              {state.step3.documents.map((doc, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-outline-variant p-3">
                  <span className="text-sm" style={{ fontFamily: "'Montserrat', sans-serif" }}>{doc.name}</span>
                  <button type="button" onClick={() => removeFile('documents', i)} className="text-on-surface-variant"><X className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between">
          <Link
            to="/apply/step2"
            className="rounded-lg border border-outline-variant px-6 py-3 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Previous
          </Link>
          <button
            onClick={handleNext}
            disabled={Object.values(uploading).some(Boolean)}
            className="rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            style={{ fontFamily: "'Montserrat', sans-serif", background: '#123f5c' }}
          >
            {Object.values(uploading).some(Boolean) ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</span> : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
