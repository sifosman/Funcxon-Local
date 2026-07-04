import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, X, Upload, Loader2, FileText, CheckCircle2, Trash2 } from 'lucide-react';
import { useApplicationForm } from '../context/ApplicationFormContext';
import type { DocKey } from '../context/ApplicationFormContext';
import { validateStep3 } from '../utils/formValidation';
import { uploadFileToStorage } from '../lib/applicationService';
import { ApplicationProgress } from '../components/ApplicationProgress';
import { supabase } from '../lib/supabaseClient';

const MAX_DOC_SIZE = 10 * 1024 * 1024; // 10MB

const BUSINESS_DOCS: Array<{ key: DocKey; label: string; required: boolean; acceptLabel?: string }> = [
  { key: 'id_copy', label: 'ID Copy', required: true },
  { key: 'cipro', label: 'CIPRO / Company Registration', required: false, acceptLabel: 'If applicable' },
  { key: 'company_logo', label: 'Company Logo', required: true },
];

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
    bucket: 'portfolio-images' | 'portfolio-videos',
    files: FileList | null,
    key: 'images' | 'videos',
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
        const item = { uri: result.url, name: file.name, type: file.type };
        updateStep3({ [key]: [...current, item] });
      } else {
        setErrors((prev) => ({ ...prev, [key]: `Failed to upload ${file.name}: ${result.error}` }));
      }
    }
  };

  const removeFile = (key: 'images' | 'videos', index: number) => {
    const current = state.step3[key];
    updateStep3({ [key]: current.filter((_, i) => i !== index) });
  };

  const uploadDocument = async (docType: DocKey, file: File | null) => {
    if (!file) return;
    if (file.size > MAX_DOC_SIZE) {
      setErrors((prev) => ({ ...prev, [docType]: `${file.name} exceeds 10MB limit` }));
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setUploading((prev) => ({ ...prev, [docType]: true }));
    const isImage = file.type.startsWith('image/');
    const bucket = isImage ? 'portfolio-images' : 'business-documents';
    const result = await uploadFileToStorage(bucket, file, user.id);
    setUploading((prev) => ({ ...prev, [docType]: false }));

    if (result.success && result.url) {
      const filtered = state.step3.documents.filter((d) => d.docType !== docType);
      const newDoc = { uri: result.url, name: file.name, type: file.type, docType };
      updateStep3({ documents: [...filtered, newDoc] });
      setErrors((prev) => { const next = { ...prev }; delete next[docType]; return next; });
    } else {
      setErrors((prev) => ({ ...prev, [docType]: `Failed to upload ${file.name}: ${result.error}` }));
    }
  };

  const removeDocument = (docType: DocKey) => {
    updateStep3({ documents: state.step3.documents.filter((d) => d.docType !== docType) });
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
          style={{ color: '#123f5c' }}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Link>

        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ color: '#123f5c' }}>
            Step 3: Portfolio Media
          </h1>
          <ApplicationProgress currentStep={3} />
        </div>

        <div className="space-y-8">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant" >
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
              <label htmlFor="image-upload" className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90" style={{ background: '#123f5c' }}>
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
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant" >
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
              <label htmlFor="video-upload" className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-outline-variant bg-white px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-low" >
                <Upload className="h-4 w-4" /> Upload Videos
              </label>
            </div>
            <div className="mt-3 space-y-2">
              {state.step3.videos.map((vid, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-outline-variant p-3">
                  <span className="text-sm" >{vid.name}</span>
                  <button type="button" onClick={() => removeFile('videos', i)} className="text-on-surface-variant"><X className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Business Documents */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Business Documents
            </label>
            <p className="mb-4 text-sm text-on-surface-variant">
              Upload required business documents (PDF, DOC, DOCX, PNG, JPG — max 10MB each)
            </p>
            <div className="space-y-4">
              {BUSINESS_DOCS.map((doc) => {
                const existing = state.step3.documents.find((d) => d.docType === doc.key);
                const isUploading = uploading[doc.key];
                const hasError = errors[doc.key];
                return (
                  <div key={doc.key}>
                    <div className="mb-1 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-on-surface-variant" />
                        <span className="text-sm font-medium text-on-surface">
                          {doc.label}{doc.required ? ' *' : ''}
                        </span>
                      </div>
                      {doc.acceptLabel && !existing && (
                        <span className="text-xs italic text-on-surface-variant">{doc.acceptLabel}</span>
                      )}
                    </div>

                    {existing ? (
                      <div className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface-container-low p-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-on-surface">{existing.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDocument(doc.key)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className={`rounded-lg border border-dashed p-4 text-center ${hasError ? 'border-red-400' : 'border-outline-variant'}`}>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,image/*"
                          className="hidden"
                          id={`doc-upload-${doc.key}`}
                          onChange={(e) => uploadDocument(doc.key, e.target.files?.[0] ?? null)}
                        />
                        <label
                          htmlFor={`doc-upload-${doc.key}`}
                          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-outline-variant bg-white px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
                        >
                          {isUploading ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
                          ) : (
                            <><Upload className="h-4 w-4" /> Tap to upload</>
                          )}
                        </label>
                      </div>
                    )}
                    {hasError && <p className="mt-1 text-xs text-red-500">{hasError}</p>}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        <div className="mt-10 flex items-center justify-between">
          <Link
            to="/apply/step2"
            className="rounded-lg border border-outline-variant px-6 py-3 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
            
          >
            Previous
          </Link>
          <button
            onClick={handleNext}
            disabled={Object.values(uploading).some(Boolean)}
            className="rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            style={{ background: '#123f5c' }}
          >
            {Object.values(uploading).some(Boolean) ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</span> : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
