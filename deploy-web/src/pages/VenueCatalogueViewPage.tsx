import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { ChevronLeft, MapPin, FileText, Loader2, Minus, Plus, CheckCircle } from 'lucide-react';

interface CatalogueItem {
  id: number;
  title: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  is_active: boolean;
}

interface PdfDocument {
  id: number;
  document_url: string;
  file_name: string | null;
}

export default function VenueCatalogueViewPage() {
  const { id } = useParams<{ id: string }>();
  const [venueName, setVenueName] = useState<string | null>(null);
  const [items, setItems] = useState<CatalogueItem[]>([]);
  const [pdfs, setPdfs] = useState<PdfDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  useEffect(() => {
    if (id) fetchCatalogue();
  }, [id]);

  async function fetchCatalogue() {
    setLoading(true);
    try {
      const { data: listing } = await supabase.from('venue_listings').select('id, name').eq('id', id).maybeSingle();
      if (!listing) {
        setVenueName(null);
        setItems([]);
        setPdfs([]);
        setLoading(false);
        return;
      }
      setVenueName(listing.name);
      const [{ data: itemRows }, { data: pdfRows }] = await Promise.all([
        supabase.from('venue_catalogue_items').select('id, title, description, price, image_url, is_active').eq('listing_id', listing.id).order('sort_order', { ascending: true }),
        supabase.from('venue_documents').select('id, document_url, file_name').eq('venue_id', listing.id).eq('document_type', 'catalogue_pdf').order('created_at', { ascending: false }),
      ]);
      setItems((itemRows || []).filter((i: any) => i.is_active !== false) as CatalogueItem[]);
      setPdfs((pdfRows || []) as PdfDocument[]);
    } catch (err) {
      console.error('Error fetching catalogue:', err);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (n?: number | null) => n != null ? `R${Number(n).toLocaleString()}` : '—';

  const toggleItem = (itemId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
    setQuantities((prev) => ({ ...prev, [itemId]: prev[itemId] || 1 }));
  };

  const updateQuantity = (itemId: number, delta: number) => {
    setQuantities((prev) => {
      const current = prev[itemId] || 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [itemId]: next };
    });
  };

  const selectedItems = useMemo(() => {
    return items.filter((item) => selectedIds.has(item.id)).map((item) => ({ ...item, quantity: quantities[item.id] || 1 }));
  }, [items, selectedIds, quantities]);

  const total = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0);
  }, [selectedItems]);

  const quoteRequestUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set('venueId', id || '');
    params.set('venueName', venueName || '');
    selectedItems.forEach((item, idx) => {
      params.set(`item_${idx}_title`, item.title);
      params.set(`item_${idx}_quantity`, String(item.quantity));
      params.set(`item_${idx}_price`, item.price != null ? String(item.price) : '');
    });
    return `/quote-request?${params.toString()}`;
  }, [id, venueName, selectedItems]);

  if (loading) {
    return (
      <div className="fx-container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!venueName) {
    return (
      <div className="fx-container fx-section">
        <div className="mx-auto max-w-2xl text-center">
          <MapPin className="mx-auto h-12 w-12 text-on-surface-variant" />
          <h2 className="mt-4 font-display text-xl font-bold text-on-surface">Venue not found</h2>
          <Link to="/discover" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">Browse Venues</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-4xl">
        <Link to={`/venue/${id}`} className="mb-4 inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary">
          <ChevronLeft className="h-4 w-4" /> Back to {venueName}
        </Link>
        <h1 className="font-display text-2xl font-bold text-on-surface md:text-3xl">{venueName} — Catalogue</h1>

        {/* PDF Pricelist */}
        {pdfs.length > 0 && (
          <div className="mt-6 rounded-xl bg-white p-6 shadow-sm border border-outline-variant">
            <h2 className="mb-4 font-display text-lg font-semibold text-on-surface flex items-center gap-2">
              <FileText className="h-5 w-5" /> Pricelist PDFs
            </h2>
            <div className="space-y-2">
              {pdfs.map(doc => (
                <a
                  key={doc.id}
                  href={doc.document_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-outline-variant p-3 text-sm text-primary hover:underline"
                >
                  <FileText className="h-4 w-4" /> {doc.file_name || 'Catalogue PDF'}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Catalogue Items */}
        <div className="mt-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-on-surface">Items & Packages</h2>
          {items.length === 0 ? (
            <div className="rounded-xl border border-outline-variant bg-white p-10 text-center">
              <p className="text-sm text-on-surface-variant">No catalogue items available yet.</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map(item => {
                  const isSelected = selectedIds.has(item.id);
                  return (
                    <div key={item.id} className={`overflow-hidden rounded-xl bg-white shadow-sm border-2 transition-colors ${isSelected ? 'border-primary' : 'border-outline-variant'}`}>
                      <div className="h-40 w-full overflow-hidden bg-surface-container">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-on-surface-variant">
                            <FileText className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-on-surface">{item.title}</h3>
                            {item.description && <p className="mt-1 line-clamp-2 text-sm text-on-surface-variant">{item.description}</p>}
                          </div>
                          <button onClick={() => toggleItem(item.id)} className={`rounded-full p-1 ${isSelected ? 'text-primary' : 'text-on-surface-variant'}`}>
                            <CheckCircle className="h-6 w-6" />
                          </button>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <p className="text-lg font-bold text-primary">{formatCurrency(item.price)}</p>
                          {isSelected && (
                            <div className="flex items-center gap-2">
                              <button onClick={() => updateQuantity(item.id, -1)} className="rounded-full bg-surface-container p-1 text-on-surface hover:bg-surface-container-high"><Minus className="h-4 w-4" /></button>
                              <span className="min-w-[1.5rem] text-center text-sm font-semibold">{quantities[item.id] || 1}</span>
                              <button onClick={() => updateQuantity(item.id, 1)} className="rounded-full bg-surface-container p-1 text-on-surface hover:bg-surface-container-high"><Plus className="h-4 w-4" /></button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {selectedItems.length > 0 && (
                <div className="mt-6 rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm text-on-surface-variant">{selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected</p>
                      <p className="text-2xl font-bold text-on-surface">{formatCurrency(total)}</p>
                    </div>
                    <Link to={quoteRequestUrl} className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white" style={{ background: '#123f5c' }}>Request Quote</Link>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
