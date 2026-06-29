import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Edit2, Upload, FileText, Loader2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { uploadFileToStorage } from '../lib/applicationService';
import { AppAlert } from '../components/AppAlert';

type VendorRow = { id: number; name: string; subscription_tier?: string | null; subscription_status?: string | null };

type CatalogueItem = {
  id: number;
  vendor_id: number;
  title: string;
  description: string | null;
  price: number | null;
  currency: string;
  sort_order: number;
  is_active: boolean;
  image_url: string | null;
};

type PdfDocument = { id: number; document_url: string; file_name: string | null; created_at: string };

const FREE_CATALOGUE_LIMIT = 10;

export default function VendorCataloguePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState<VendorRow | null>(null);
  const [items, setItems] = useState<CatalogueItem[]>([]);
  const [pdfs, setPdfs] = useState<PdfDocument[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<number | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [alert, setAlert] = useState<{ title: string; message: string; type: 'error' | 'success' | 'warning' } | null>(null);
  const [editItem, setEditItem] = useState<CatalogueItem | null>(null);
  const [form, setForm] = useState({ title: '', description: '', price: '', is_active: true });
  const [showForm, setShowForm] = useState(false);

  const isFreeTier = useMemo(() => {
    const tier = String(vendor?.subscription_tier ?? '').toLowerCase();
    return tier === '' || tier === 'free' || tier === 'get_started' || tier === 'get started';
  }, [vendor?.subscription_tier]);

  const canAddMoreItems = useMemo(() => {
    if (!isFreeTier) return true;
    return items.length < FREE_CATALOGUE_LIMIT;
  }, [isFreeTier, items.length]);

  const sortedItems = useMemo(() => [...items].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)), [items]);

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data: vendorRow } = await supabase.from('vendors').select('id, name, subscription_tier, subscription_status').eq('user_id', user.id).maybeSingle();
      if (!vendorRow) { setVendor(null); setItems([]); setPdfs([]); setLoading(false); return; }
      setVendor(vendorRow);
      const [{ data: itemRows }, { data: pdfRows }] = await Promise.all([
        supabase.from('vendor_catalogue_items').select('id, vendor_id, title, description, price, currency, sort_order, is_active, image_url').eq('vendor_id', vendorRow.id).order('sort_order', { ascending: true }),
        supabase.from('vendor_documents').select('id, document_url, file_name, created_at').eq('vendor_id', vendorRow.id).eq('document_type', 'catalogue_pdf').order('created_at', { ascending: false }),
      ]);
      setItems((itemRows || []) as CatalogueItem[]);
      setPdfs((pdfRows || []) as PdfDocument[]);
    } catch (err: any) {
      setAlert({ title: 'Error', message: err?.message || 'Failed to load catalogue.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user?.id]);

  const openNew = () => {
    if (!canAddMoreItems) {
      setAlert({ title: 'Catalogue Limit Reached', message: `Your free plan allows up to ${FREE_CATALOGUE_LIMIT} catalogue items. Upgrade to add more.`, type: 'warning' });
      return;
    }
    setEditItem(null); setForm({ title: '', description: '', price: '', is_active: true }); setShowForm(true);
  };
  const openEdit = (item: CatalogueItem) => { setEditItem(item); setForm({ title: item.title, description: item.description || '', price: item.price != null ? String(item.price) : '', is_active: item.is_active }); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditItem(null); };

  const handleSaveItem = async () => {
    if (!vendor) { setAlert({ title: 'Error', message: 'Create a vendor profile first.', type: 'error' }); return; }
    if (!form.title.trim()) { setAlert({ title: 'Required', message: 'Title is required.', type: 'error' }); return; }
    if (!editItem && !canAddMoreItems) { setAlert({ title: 'Catalogue Limit Reached', message: `Your free plan allows up to ${FREE_CATALOGUE_LIMIT} catalogue items. Upgrade to add more.`, type: 'warning' }); return; }
    const price = form.price.trim() ? Number(form.price.trim()) : null;
    if (form.price.trim() && (Number.isNaN(price) || price === null)) { setAlert({ title: 'Invalid', message: 'Price must be a number.', type: 'error' }); return; }
    setSaving(true);
    try {
      if (editItem) {
        await supabase.from('vendor_catalogue_items').update({ title: form.title.trim(), description: form.description.trim() || null, price, is_active: form.is_active }).eq('id', editItem.id);
      } else {
        const nextSort = items.length > 0 ? Math.max(...items.map((i) => i.sort_order || 0)) + 1 : 0;
        await supabase.from('vendor_catalogue_items').insert({ vendor_id: vendor.id, title: form.title.trim(), description: form.description.trim() || null, price, currency: 'ZAR', sort_order: nextSort, is_active: form.is_active });
      }
      closeForm();
      await load();
    } catch (err: any) { setAlert({ title: 'Error', message: err?.message || 'Failed to save item.', type: 'error' }); } finally { setSaving(false); }
  };

  const handleDeleteItem = async (item: CatalogueItem) => {
    if (!confirm(`Remove "${item.title}" from your catalogue?`)) return;
    try { await supabase.from('vendor_catalogue_items').delete().eq('id', item.id); await load(); } catch (err: any) { setAlert({ title: 'Error', message: err?.message || 'Failed to delete item.', type: 'error' }); }
  };

  const handleImageUpload = async (itemId: number, files: FileList | null) => {
    if (!files || files.length === 0 || !user?.id) return;
    setUploadingImage(itemId);
    try {
      const file = files[0];
      const result = await uploadFileToStorage('portfolio-images', file, user.id);
      if (result.success && result.url) {
        await supabase.from('vendor_catalogue_items').update({ image_url: result.url }).eq('id', itemId);
        await load();
      }
    } catch (err: any) { setAlert({ title: 'Upload Failed', message: err?.message || 'Could not upload image.', type: 'error' }); } finally { setUploadingImage(null); }
  };

  const handlePdfUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !vendor || !user?.id) return;
    setUploadingPdf(true);
    try {
      const file = files[0];
      const result = await uploadFileToStorage('business-documents', file, user.id);
      if (result.success && result.url) {
        await supabase.from('vendor_documents').insert({ vendor_id: vendor.id, document_type: 'catalogue_pdf', document_url: result.url, file_name: file.name, mime_type: file.type });
        await load();
      }
    } catch (err: any) { setAlert({ title: 'Upload Failed', message: err?.message || 'Could not upload PDF.', type: 'error' }); } finally { setUploadingPdf(false); }
  };

  const handleDeletePdf = async (doc: PdfDocument) => {
    if (!confirm(`Remove PDF "${doc.file_name || 'catalogue'}"?`)) return;
    try { await supabase.from('vendor_documents').delete().eq('id', doc.id); setPdfs((prev) => prev.filter((d) => d.id !== doc.id)); } catch (err: any) { setAlert({ title: 'Error', message: err?.message || 'Failed to delete PDF.', type: 'error' }); }
  };

  if (loading) return <div className="fx-container py-20 text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-4xl">
        <Link to="/vendor-dashboard" className="mb-4 inline-flex items-center text-sm font-medium hover:underline" style={{ color: '#123f5c' }}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Vendor Dashboard
        </Link>
        <h1 className="mb-2 text-3xl font-bold" style={{ color: '#123f5c' }}>Vendor Catalogue</h1>
        <p className="mb-6 text-sm" style={{ color: '#72787e' }}>{vendor ? vendor.name : 'Create a vendor profile to manage your catalogue.'}</p>

        {!vendor ? (
          <div className="rounded-xl border border-outline-variant bg-surface-container p-6 text-center">
            <p className="text-sm">Create your vendor profile first.</p>
            <Link to="/portfolio/vendor" className="mt-4 inline-block rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white" style={{ background: '#123f5c' }}>Update Vendor Portfolio</Link>
          </div>
        ) : (
          <div className="space-y-8">
            {isFreeTier && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-800">Free plan limit</p>
                <p className="text-sm text-amber-800">{items.length} of {FREE_CATALOGUE_LIMIT} items used.</p>
              </div>
            )}

            <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-display text-lg font-semibold" style={{ color: '#123f5c' }}>PDF Pricelist</h2>
              {pdfs.length === 0 && <p className="mb-4 text-sm text-on-surface-variant">No PDF pricelist uploaded.</p>}
              <div className="mb-4 space-y-2">
                {pdfs.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between rounded-lg border border-outline-variant p-3">
                    <a href={doc.document_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                      <FileText className="h-4 w-4" /> {doc.file_name || 'Catalogue PDF'}
                    </a>
                    <button onClick={() => handleDeletePdf(doc)} className="text-on-surface-variant hover:text-error"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-dashed border-outline-variant p-4 text-center">
                <input type="file" accept="application/pdf" onChange={(e) => handlePdfUpload(e.target.files)} className="hidden" id="vendor-pdf-upload" disabled={uploadingPdf} />
                <label htmlFor="vendor-pdf-upload" className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-outline-variant bg-white px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-low disabled:opacity-60">
                  <Upload className="h-4 w-4" /> {uploadingPdf ? 'Uploading...' : 'Add PDF Catalogue'}
                </label>
              </div>
            </div>

            <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold" style={{ color: '#123f5c' }}>Catalogue Items</h2>
                <button onClick={openNew} disabled={saving || (!editItem && !canAddMoreItems)} className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" style={{ background: '#123f5c' }}><Plus className="h-4 w-4" /> Add Item</button>
              </div>

              {showForm && (
                <div className="mb-6 rounded-lg border border-outline-variant bg-surface-container p-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Title</label>
                      <input type="text" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="w-full rounded-lg border border-outline-variant px-4 py-2 text-sm outline-none focus:border-primary" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Price (ZAR)</label>
                      <input type="text" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} className="w-full rounded-lg border border-outline-variant px-4 py-2 text-sm outline-none focus:border-primary" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Description</label>
                      <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} className="w-full rounded-lg border border-outline-variant px-4 py-2 text-sm outline-none focus:border-primary" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} className="h-4 w-4 accent-primary" /> Active
                    </label>
                    <button onClick={handleSaveItem} disabled={saving} className="ml-auto rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" style={{ background: '#123f5c' }}>{saving ? 'Saving...' : 'Save'}</button>
                    <button onClick={closeForm} className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface">Cancel</button>
                  </div>
                </div>
              )}

              {sortedItems.length === 0 ? (
                <p className="text-center text-sm text-on-surface-variant">No catalogue items yet.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {sortedItems.map((item) => (
                    <div key={item.id} className="flex gap-4 rounded-lg border border-outline-variant p-4">
                      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-surface-container">
                        {item.image_url ? <img src={item.image_url} alt="" className="h-full w-full object-cover" /> : (
                          <label className="flex h-full w-full cursor-pointer items-center justify-center text-on-surface-variant">
                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(item.id, e.target.files)} className="hidden" disabled={uploadingImage === item.id} />
                            {uploadingImage === item.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                          </label>
                        )}
                        {item.image_url && (
                          <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/0 text-transparent hover:bg-black/30 hover:text-white">
                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(item.id, e.target.files)} className="hidden" disabled={uploadingImage === item.id} />
                            {uploadingImage === item.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                          </label>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-on-surface">{item.title}</h3>
                            {item.description && <p className="text-sm text-on-surface-variant line-clamp-2">{item.description}</p>}
                            <p className="mt-1 font-semibold" style={{ color: '#123f5c' }}>{item.price != null ? `R${Number(item.price).toLocaleString()}` : '—'}</p>
                            {!item.is_active && <span className="text-xs text-on-surface-variant">Inactive</span>}
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => openEdit(item)} className="text-on-surface-variant hover:text-primary"><Edit2 className="h-4 w-4" /></button>
                            <button onClick={() => handleDeleteItem(item)} className="text-on-surface-variant hover:text-error"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {alert && <AppAlert visible={true} title={alert.title} message={alert.message} type={alert.type} onDismiss={() => setAlert(null)} />}
    </div>
  );
}
