import { supabase } from './supabaseClient';

export type NotificationRow = {
  id: number;
  user_id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  created_at: string;
};

export async function createNotification(notification: Omit<NotificationRow, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('notifications').insert({
    user_id: notification.user_id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    link: notification.link,
    read: notification.read ?? false,
  }).select('id').single();

  if (error) {
    console.error('[createNotification] failed:', error);
    throw error;
  }
  return data?.id;
}

export async function hasNotification(userId: string, type: string) {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('type', type);

  if (error) {
    console.error('[hasNotification] failed:', error);
    return false;
  }
  return (count ?? 0) > 0;
}

export async function createWelcomeNotification(userId: string) {
  return createNotification({
    user_id: userId,
    type: 'welcome',
    title: 'Welcome to Funxon!',
    body: 'Thanks for joining us. Explore venues, discover vendors, and plan unforgettable events all in one place.',
    link: null,
    read: false,
  });
}

export async function ensureWelcomeNotification(userId: string) {
  const exists = await hasNotification(userId, 'welcome');
  if (!exists) {
    await createWelcomeNotification(userId);
  }
}

export async function createAccountNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
  link?: string | null
) {
  return createNotification({
    user_id: userId,
    type,
    title,
    body,
    link: link ?? null,
    read: false,
  });
}

export async function createTourRequestedNotification(
  listingOwnerUserId: string,
  visitorName: string,
  requestedDate: string | null
) {
  const dateLabel = requestedDate
    ? new Date(requestedDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'a requested date';

  return createNotification({
    user_id: listingOwnerUserId,
    type: 'tour_requested',
    title: 'New tour request',
    body: `${visitorName || 'A visitor'} requested a tour for ${dateLabel}`,
    link: '/venue/tours',
    read: false,
  });
}

export async function createTourResponseNotification(
  visitorUserId: string,
  venueName: string,
  status: string,
  bookingId: number
) {
  let title = 'Tour update';
  let body = `${venueName || 'Venue'} updated your tour request.`;

  if (status === 'confirmed') {
    title = 'Tour confirmed';
    body = `${venueName || 'Venue'} confirmed your tour request.`;
  } else if (status === 'countered') {
    title = 'Alternative tour date proposed';
    body = `${venueName || 'Venue'} proposed an alternative tour date.`;
  } else if (status === 'cancelled') {
    title = 'Tour cancelled';
    body = `${venueName || 'Venue'} cancelled your tour request.`;
  } else if (status === 'completed') {
    title = 'Tour completed';
    body = `Your tour at ${venueName || 'Venue'} has been marked as completed.`;
  }

  return createNotification({
    user_id: visitorUserId,
    type: 'tour_response',
    title,
    body,
    link: `/bookings/${bookingId}`,
    read: false,
  });
}

export async function createQuoteRequestedNotification(
  listerUserId: string,
  requesterName: string,
  listingName: string,
  isVenue: boolean
) {
  return createNotification({
    user_id: listerUserId,
    type: 'quote_requested',
    title: 'New quote request',
    body: `${requesterName || 'A visitor'} requested a quote for ${listingName || 'your listing'}.`,
    link: isVenue ? '/venue/quote-requests' : '/vendor/quotes',
    read: false,
  });
}

export async function createQuoteQuotedNotification(
  requesterUserId: string,
  listingName: string,
  quoteId: number,
  isVenue: boolean
) {
  return createNotification({
    user_id: requesterUserId,
    type: 'quote_quoted',
    title: 'Quote received',
    body: `${listingName || 'A lister'} sent you a quote. Please open the app to view the updated quote.`,
    link: isVenue ? `/quotes/${quoteId}` : `/quotes/${quoteId}`,
    read: false,
  });
}

export async function createQuoteAmendedNotification(
  listerUserId: string,
  requesterName: string,
  listingName: string,
  quoteId: number,
  isVenue: boolean
) {
  return createNotification({
    user_id: listerUserId,
    type: 'quote_amended',
    title: 'Quote amendment requested',
    body: `${requesterName || 'A visitor'} requested changes to the quote for ${listingName || 'your listing'}.`,
    link: isVenue ? `/venue/quote-requests/${quoteId}` : `/vendor/quotes/${quoteId}`,
    read: false,
  });
}

export async function createQuoteAcceptedNotification(
  listerUserId: string,
  requesterName: string,
  listingName: string,
  quoteId: number,
  isVenue: boolean
) {
  return createNotification({
    user_id: listerUserId,
    type: 'quote_accepted',
    title: 'Quote accepted',
    body: `${requesterName || 'A visitor'} accepted your quote for ${listingName || 'your listing'}.`,
    link: isVenue ? `/venue/quote-requests/${quoteId}` : `/vendor/quotes/${quoteId}`,
    read: false,
  });
}

export async function fetchNotifications(userId: string, limit = 50, onlyUnread = false) {
  let query = supabase
    .from('notifications')
    .select('id, user_id, type, title, body, link, read, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (onlyUnread) {
    query = query.eq('read', false);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[fetchNotifications] failed:', error);
    throw error;
  }
  return (data || []) as NotificationRow[];
}

export async function fetchUnreadCount(userId: string) {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    console.error('[fetchUnreadCount] failed:', error);
    return 0;
  }
  return count || 0;
}

export async function markNotificationRead(notificationId: number) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('[markNotificationRead] failed:', error);
    throw error;
  }
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    console.error('[markAllNotificationsRead] failed:', error);
    throw error;
  }
}
