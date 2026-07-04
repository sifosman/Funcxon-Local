/**
 * Shared quote workflow types, status helpers, and constants.
 */

export type QuoteStatus =
  | 'pending'
  | 'quoted'
  | 'amended'
  | 'accepted'
  | 'rejected'
  | 'finalised'
  | 'cancelled';

export const QUOTE_STATUSES: readonly QuoteStatus[] = [
  'pending',
  'quoted',
  'amended',
  'accepted',
  'rejected',
  'finalised',
  'cancelled',
];

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  pending: 'Pending',
  quoted: 'Quote Received',
  amended: 'Amended',
  accepted: 'Accepted',
  rejected: 'Rejected',
  finalised: 'Finalised',
  cancelled: 'Cancelled',
};

export type QuoteRequest = {
  id: number;
  vendor_id?: number | null;
  user_id?: number | null;
  name: string;
  email: string;
  phone?: string | null;
  contact_phone?: string | null;
  event_type?: string | null;
  event_date?: string | null;
  end_date?: string | null;
  requirements?: string | null;
  details?: string | null;
  budget?: string | null;
  status: QuoteStatus | string;
  quote_amount?: number | null;
  quoted_amount?: number | null;
  response_message?: string | null;
  amended_message?: string | null;
  line_items?: QuoteLineItem[] | null;
  created_at?: string | null;
  updated_at?: string | null;
  accepted_at?: string | null;
  rejected_at?: string | null;
  amended_at?: string | null;
  cancelled_at?: string | null;
  finalised_at?: string | null;
};

export type VenueQuoteRequest = {
  id: number;
  listing_id: number;
  requester_user_id?: string | null;
  requester_name?: string | null;
  requester_email?: string | null;
  requester_phone?: string | null;
  contact_phone?: string | null;
  event_date?: string | null;
  end_date?: string | null;
  message?: string | null;
  requirements?: string | null;
  status: QuoteStatus | string;
  line_items?: QuoteLineItem[] | null;
  response_message?: string | null;
  amended_message?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  accepted_at?: string | null;
  rejected_at?: string | null;
  amended_at?: string | null;
  cancelled_at?: string | null;
  finalised_at?: string | null;
};

export type QuoteLineItem = {
  id?: string | number;
  title: string;
  description?: string | null;
  price: number;
  quantity: number;
  image_url?: string | null;
  catalogue_item_id?: number | null;
};

export type QuoteRevision = {
  id: number;
  quote_request_id: number;
  vendor_id?: number | null;
  quote_amount?: number | null;
  description?: string | null;
  validity_days?: number;
  terms?: string | null;
  revision_number: number;
  created_by: string;
  notes?: string | null;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  client_notes?: string | null;
  responded_at?: string | null;
  attachments?: unknown;
  created_at: string;
};

export function isQuoteStatus(value: string): value is QuoteStatus {
  return (QUOTE_STATUSES as readonly string[]).includes(value);
}

export function normalizeQuoteStatus(value?: string | null): QuoteStatus {
  if (!value) return 'pending';
  const lower = value.toLowerCase();
  if (lower === 'new') return 'pending';
  return isQuoteStatus(lower) ? lower : 'pending';
}

export function quoteStatusLabel(status?: string | null): string {
  const normalized = normalizeQuoteStatus(status);
  return QUOTE_STATUS_LABELS[normalized] ?? normalized;
}

export function isQuoteEditable(status?: string | null): boolean {
  const normalized = normalizeQuoteStatus(status);
  return normalized === 'pending' || normalized === 'amended';
}

export function isQuoteRespondable(status?: string | null): boolean {
  const normalized = normalizeQuoteStatus(status);
  return normalized === 'quoted' || normalized === 'amended';
}

export function isQuoteFinal(status?: string | null): boolean {
  const normalized = normalizeQuoteStatus(status);
  return normalized === 'accepted' || normalized === 'finalised' || normalized === 'rejected';
}

export function calculateLineItemsTotal(lineItems: QuoteLineItem[] | null | undefined): number {
  if (!lineItems || !Array.isArray(lineItems)) return 0;
  return lineItems.reduce((sum, item) => {
    const price = Number(item?.price ?? 0);
    const quantity = Number(item?.quantity ?? 0);
    return sum + price * quantity;
  }, 0);
}

export function getQuoteEffectiveStatus(status?: string | null, quoteAmount?: number | null): QuoteStatus {
  const normalized = normalizeQuoteStatus(status);
  if (normalized === 'pending' && quoteAmount != null && quoteAmount > 0) return 'quoted';
  return normalized;
}
