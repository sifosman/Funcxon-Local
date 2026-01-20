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

export async function getFavourites(user?: AuthUserRef): Promise<number[]> {
  const internalUserId = await resolveUserId(user);
  if (!internalUserId) return [];

  const { data, error } = await supabase
    .from('shortlists')
    .select('vendor_id')
    .eq('user_id', internalUserId);

  if (error || !data) {
    return [];
  }

  return data
    .map((row) => row.vendor_id)
    .filter((value): value is number => typeof value === 'number');
}

export async function getShortlists(user?: AuthUserRef): Promise<{ id: number; vendorId: number; notes: string | null }[]> {
  const internalUserId = await resolveUserId(user);
  if (!internalUserId) return [];

  const { data, error } = await supabase
    .from('shortlists')
    .select('id, vendor_id, notes')
    .eq('user_id', internalUserId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data
    .map((row) => ({ id: row.id, vendorId: row.vendor_id, notes: row.notes ?? null }))
    .filter((row) => typeof row.vendorId === 'number');
}

export async function toggleFavourite(user: AuthUserRef, vendorId: number): Promise<number[]> {
  const internalUserId = await resolveUserId(user);
  if (!internalUserId) return [];

  const { data: existing, error: existingError } = await supabase
    .from('shortlists')
    .select('id')
    .eq('user_id', internalUserId)
    .eq('vendor_id', vendorId)
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
      .insert({ user_id: internalUserId, vendor_id: vendorId });
  }

  return getFavourites(user);
}

export async function isFavourite(user: AuthUserRef, vendorId: number): Promise<boolean> {
  const internalUserId = await resolveUserId(user);
  if (!internalUserId) return false;

  const { data } = await supabase
    .from('shortlists')
    .select('id')
    .eq('user_id', internalUserId)
    .eq('vendor_id', vendorId)
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
