import { supabase } from './supabaseClient';

type AuthUserRef = { id: string; email?: string | null } | null | undefined;

async function resolveUserId(user?: AuthUserRef): Promise<number | null> {
  if (!user?.id) return null;
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.id ?? null;
}

export async function getFavourites(user?: AuthUserRef): Promise<{ vendorIds: number[], venueIds: number[] }> {
  const internalUserId = await resolveUserId(user);
  if (!internalUserId) return { vendorIds: [], venueIds: [] };

  const { data, error } = await supabase
    .from('shortlists')
    .select('vendor_id, venue_id')
    .eq('user_id', internalUserId);

  if (error || !data) {
    return { vendorIds: [], venueIds: [] };
  }

  const vendorIds = data
    .map((row) => row.vendor_id)
    .filter((value): value is number => typeof value === 'number');
    
  const venueIds = data
    .map((row) => row.venue_id)
    .filter((value): value is number => typeof value === 'number');

  return { vendorIds, venueIds };
}

export async function getShortlists(user?: AuthUserRef): Promise<{ id: number; vendorId?: number | null; venueId?: number | null; notes: string | null }[]> {
  const internalUserId = await resolveUserId(user);
  if (!internalUserId) return [];

  const { data, error } = await supabase
    .from('shortlists')
    .select('id, vendor_id, venue_id, notes')
    .eq('user_id', internalUserId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    vendorId: row.vendor_id,
    venueId: row.venue_id,
    notes: row.notes ?? null
  }));
}

export async function toggleFavourite(user: AuthUserRef, id: number, type: 'vendor' | 'venue' = 'vendor'): Promise<{ vendorIds: number[], venueIds: number[] }> {
  const internalUserId = await resolveUserId(user);
  if (!internalUserId) return { vendorIds: [], venueIds: [] };

  const column = type === 'venue' ? 'venue_id' : 'vendor_id';

  const { data: existing, error: existingError } = await supabase
    .from('shortlists')
    .select('id')
    .eq('user_id', internalUserId)
    .eq(column, id)
    .maybeSingle();

  if (existingError && existingError.code !== 'PGRST116') {
    throw existingError;
  }

  if (existing?.id) {
    await supabase
      .from('shortlists')
      .delete()
      .eq('id', existing.id);
  } else {
    await supabase
      .from('shortlists')
      .insert({ user_id: internalUserId, [column]: id });
  }

  return getFavourites(user);
}

export async function isFavourite(user: AuthUserRef, id: number, type: 'vendor' | 'venue' = 'vendor'): Promise<boolean> {
  const internalUserId = await resolveUserId(user);
  if (!internalUserId) return false;

  const column = type === 'venue' ? 'venue_id' : 'vendor_id';

  const { data } = await supabase
    .from('shortlists')
    .select('id')
    .eq('user_id', internalUserId)
    .eq(column, id)
    .maybeSingle();

  return !!data?.id;
}

export async function updateShortlistNotes(
  user: AuthUserRef,
  shortlistId: number,
  notes: string | null,
): Promise<void> {
  const internalUserId = await resolveUserId(user);
  if (!internalUserId) return;

  const { error } = await supabase
    .from('shortlists')
    .update({ notes })
    .eq('id', shortlistId)
    .eq('user_id', internalUserId);

  if (error) {
    throw error;
  }
}
