-- Seed missing event types from "09.01.2026_Categories tags etc.xlsx" (Event Type tab)
-- Adds the 16 event types that were missing from dropdown_options.
-- Existing rows (wedding, engagement, birthday, kids_party, baby_shower, bridal_shower,
-- matric_dance, corporate, conference, other) are left untouched.

insert into public.dropdown_options (type, code, label, sort_order, is_active)
values
  ('event_type', 'anniversary',         'Anniversary',          110, true),
  ('event_type', 'graduation_awards',   'Graduation/Awards',    120, true),
  ('event_type', 'birthday_adult',      'Birthday - Adult',     130, true),
  ('event_type', 'birthday_kiddies',    'Birthday - Kiddies',   140, true),
  ('event_type', 'community_fair',      'Community Fair',       150, true),
  ('event_type', 'live_show_concert',   'Live Show/Concert',    160, true),
  ('event_type', 'corporate_party',     'Corporate Party',      170, true),
  ('event_type', 'cultural_celebration','Cultural Celebration', 180, true),
  ('event_type', 'expo',                'Expo',                 190, true),
  ('event_type', 'festival',            'Festival',             200, true),
  ('event_type', 'fundraiser',          'Fundraiser',           210, true),
  ('event_type', 'product_launch',      'Product Launch',       220, true),
  ('event_type', 'market',              'Market',               230, true),
  ('event_type', 'sports_tournament',   'Sports Tournament',    240, true),
  ('event_type', 'teambuilding',        'Teambuilding',         250, true),
  ('event_type', 'reunion',             'Reunion',              260, true)
on conflict (type, code) do nothing;
