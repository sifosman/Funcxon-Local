import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Edit2, Upload, Loader2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { uploadFileToStorage } from '../lib/applicationService';
import { AppAlert } from '../components/AppAlert';
import { getCatalogueItemLimit, isCatalogueLimitReached } from '../lib/catalogue';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

type VenueListing = { id: number; name: string; subscription_plan?: string | null; subscription_status?: string | null };

type CatalogueItem = {
  id: number;
  listing_id: number;
  title: string;
  description: string | null;
  price: number | null;
  currency: string;
  sort_order: number;
  is_active: boolean;
  image_url: string | null;
};

export default function VenueCataloguePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState<VenueListing | null>(null);
  const [items, setItems] = useState<CatalogueItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<number | null>(null);
  const [alert, setAlert] = useState<{ title: string; message: string; type: 'error' | 'success' | 'warning' } | null>(null);
  const [itemLimit, setItemLimit] = useState<number>(0);
  const [editItem, setEditItem] = useState<CatalogueItem | null>(null);
  const [form, setForm] = useState({ title: '', description: '', price: '', is_active: true });
  const [showForm, setShowForm] = useState(false);
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [pickedPreview, setPickedPreview] = useState<string | null>(null);

  const sortedItems = useMemo(() => [...items].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)), [items]);
  const canAddMoreItems = useMemo(() => !isCatalogueLimitReached(items.length, itemLimit), [items.length, itemLimit]);

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      let { data: listingRow } = await supabase.from('venue_listings').select('id, name, subscription_plan, subscription_status').eq('user_id', user.id).maybeSingle();
      if (!listingRow) {
        const { data: legacy } = await supabase.from('venues').select('id, name, subscription_plan_key, subscription_status').eq('user_id', user.id).maybeSingle();
        if (legacy) {
          const { data: created } = await supabase.from('venue_listings').upsert({ user_id: user.id, name: legacy.name || 'Venue Listing', subscription_plan: legacy.subscription_plan_key || 'get_started', subscription_status: legacy.subscription_status || 'active' }, { onConflict: 'user_id' }).select('id, name, subscription_plan, subscription_status').single();
          listingRow = created;
        }
      }
      if (!listingRow) { setListing(null); setItems([]); setLoading(false); return; }
      setListing(listingRow);
      const { data: itemRows } = await supabase
        .from('venue_catalogue_items')
        .select('id, listing_id, title, description, price, currency, sort_order, is_active, image_url')
        .eq('listing_id', listingRow.id)
        .order('sort_order', { ascending: true });
      setItems((itemRows || []) as CatalogueItem[]);
      const limit = await getCatalogueItemLimit('venue', listingRow.subscription_plan || 'get_started');
      setItemLimit(limit);
    } catch (err: any) {
      setAlert({ title: 'Error', message: err?.message || 'Failed to load catalogue.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user?.id]);

  const openNew = () => {
    if (!canAddMoreItems) {
      setAlert({ title: 'Catalogue Limit Reached', message: `Your plan allows up to ${itemLimit} catalogue items. Upgrade to add more.`, type: 'warning' });
      return;
    }
    setEditItem(null); setForm({ title: '', description: '', price: '', is_active: true }); setPickedFile(null); setPickedPreview(null); setShowForm(true);
  };
  const openEdit = (item: CatalogueItem) => { setEditItem(item); setForm({ title: item.title, description: item.description || '', price: item.price != null ? String(item.price) : '', is_active: item.is_active }); setPickedFile(null); setPickedPreview(null); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditItem(null); setPickedFile(null); setPickedPreview(null); };

  const handlePickFile = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.size > MAX_IMAGE_SIZE) {
      setAlert({ title: 'Image Too Large', message: `${file.name} is ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum allowed is 10MB.`, type: 'error' });
      return;
    }
    setPickedFile(file);
    setPickedPreview(URL.createObjectURL(file));
  };

  const uploadCatalogueImage = async (file: File, itemId: number) => {
    const result = await uploadFileToStorage('portfolio-images', file, user!.id);
    if (result.success && result.url) {
      await supabase.from('venue_catalogue_items').update({ image_url: result.url }).eq('id', itemId);
    } else {
      throw new Error(result.error || 'Upload failed');
    }
  };

  const handleSaveItem = async () => {
    if (!listing) { setAlert({ title: 'Error', message: 'Create a venue listing first.', type: 'error' }); return; }
    if (!form.title.trim()) { setAlert({ title: 'Required', message: 'Title is required.', type: 'error' }); return; }
    if (!editItem && !canAddMoreItems) { setAlert({ title: 'Catalogue Limit Reached', message: `Your plan allows up to ${itemLimit} catalogue items. Upgrade to add more.`, type: 'warning' }); return; }
    const price = form.price.trim() ? Number(form.price.trim()) : null;
    if (form.price.trim() && (Number.isNaN(price) || price === null)) { setAlert({ title: 'Invalid', message: 'Price must be a number.', type: 'error' }); return; }
    setSaving(true);
    try {
      if (editItem) {
        await supabase.from('venue_catalogue_items').update({ title: form.title.trim(), description: form.description.trim() || null, price, is_active: form.is_active }).eq('id', editItem.id);
        if (pickedFile) { await uploadCatalogueImage(pickedFile, editItem.id); }
      } else {
        const nextSort = items.length > 0 ? Math.max(...items.map((i) => i.sort_order || 0)) + 1 : 0;
        const { data: insertedRow } = await supabase.from('venue_catalogue_items').insert({ listing_id: listing.id, title: form.title.trim(), description: form.description.trim() || null, price, currency: 'ZAR', sort_order: nextSort, is_active: form.is_active }).select('id').single();
        if (pickedFile && insertedRow) { await uploadCatalogueImage(pickedFile, insertedRow.id); }
      }
      closeForm();
      await load();
    } catch (err: any) { setAlert({ title: 'Error', message: err?.message || 'Failed to save item.', type: 'error' }); } finally { setSaving(false); }
  };

  const handleDeleteItem = async (item: CatalogueItem) => {
    if (!confirm(`Remove "${item.title}" from your catalogue?`)) return;
    try { await supabase.from('venue_catalogue_items').delete().eq('id', item.id); await load(); } catch (err: any) { setAlert({ title: 'Error', message: err?.message || 'Failed to delete item.', type: 'error' }); }
  };

  const handleImageUpload = async (itemId: number, files: FileList | null) => {
    if (!files || files.length === 0 || !user?.id) return;
    const file = files[0];
    if (file.size > MAX_IMAGE_SIZE) {
      setAlert({ title: 'Image Too Large', message: `${file.name} is ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum allowed is 10MB.`, type: 'error' });
      return;
    }
    setUploadingImage(itemId);
    try {
      const result = await uploadFileToStorage('portfolio-images', file, user.id);
      if (result.success && result.url) {
        await supabase.from('venue_catalogue_items').update({ image_url: result.url }).eq('id', itemId);
        await load();
      }
    } catch (err: any) { setAlert({ title: 'Upload Failed', message: err?.message || 'Could not upload image.', type: 'error' }); } finally { setUploadingImage(null); }
  };

  if (loading) return <div className="fx-container py-20 text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-4xl">
        <Link to="/venue-dashboard" className="mb-4 inline-flex items-center text-sm font-medium hover:underline" style={{ color: '#123f5c' }}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Venue Dashboard
        </Link>
        <h1 className="mb-2 text-3xl font-bold" style={{ color: '#123f5c' }}>Venue Catalogue</h1>
        <p className="mb-6 text-sm" style={{ color: '#72787e' }}>{listing ? listing.name : 'Create a venue listing to manage your catalogue.'}</p>

        {!listing ? (
          <div className="rounded-xl border border-outline-variant bg-surface-container p-6 text-center">
            <p className="text-sm">Create your venue listing first.</p>
            <Link to="/portfolio/update-venue" className="mt-4 inline-block rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white" style={{ background: '#123f5c' }}>Update Venue Portfolio</Link>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-lg font-semibold" style={{ color: '#123f5c' }}>Catalogue Items</h2>
                  <p className="text-sm text-on-surface-variant">{items.length} of {itemLimit} items used</p>
                </div>
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
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Image (max 10MB)</label>
                      <div className="flex items-center gap-4">
                        <label className="flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-outline-variant bg-surface-container">
                          {pickedPreview ? (
                            <img src={pickedPreview} alt="" className="h-full w-full object-cover" />
                          ) : editItem?.image_url ? (
                            <img src={editItem.image_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Upload className="h-5 w-5 text-on-surface-variant" />
                          )}
                          <input type="file" accept="image/*" onChange={(e) => handlePickFile(e.target.files)} className="hidden" />
                        </label>
                        {pickedFile && (
                          <button onClick={() => { setPickedFile(null); setPickedPreview(null); }} className="text-sm text-error hover:underline">Remove image</button>
                        )}
                      </div>
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
