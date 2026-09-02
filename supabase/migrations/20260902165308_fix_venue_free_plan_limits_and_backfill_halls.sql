-- Fix venue free plan limits + backfill halls into venue_listings.features
-- 2026-09-02

-- 1) Correct the free (get_started) venue plan limits:
--    - photo_upload_limit should be 5 (was 10)
--    - video_upload_limit should be 0 (was 1)
UPDATE public.venue_subscription_plans
SET photo_upload_limit = 5,
    video_upload_limit = 0
WHERE plan_key = 'get_started';

-- 2) Backfill halls (and maxHallCapacity) into venue_listings.features from the
--    latest venue application's service_categories.halls where they are missing.
--    Fills the data-loss gap where halls captured during application were never
--    persisted to the venue listing.
WITH latest_apps AS (
  SELECT DISTINCT ON (user_id) *
  FROM public.subscriber_applications
  WHERE portfolio_type = 'venue'
  ORDER BY user_id, created_at DESC
),
selected_halls AS (
  SELECT
    la.user_id,
    jsonb_agg(h ORDER BY ord) FILTER (WHERE (h->>'name') IS NOT NULL AND btrim(h->>'name') <> '' OR (h->>'capacity') IS NOT NULL AND btrim(h->>'capacity') <> '') AS halls
  FROM latest_apps la
  CROSS JOIN LATERAL jsonb_array_elements(coalesce(la.service_categories->'halls', '[]'::jsonb)) WITH ORDINALITY AS t(h, ord)
  GROUP BY la.user_id
),
hall_caps AS (
  SELECT
    la.user_id,
    MAX(NULLIF(regexp_replace(h->>'capacity', '[^0-9]', '', 'g'), '')::int) AS max_hall_capacity
  FROM latest_apps la
  CROSS JOIN LATERAL jsonb_array_elements(coalesce(la.service_categories->'halls', '[]'::jsonb)) AS h
  GROUP BY la.user_id
)
UPDATE public.venue_listings vl
SET features = vl.features
  || jsonb_build_object('halls', coalesce(sh.halls, '[]'::jsonb))
  || jsonb_build_object('maxHallCapacity', hc.max_hall_capacity)
FROM selected_halls sh
LEFT JOIN hall_caps hc ON hc.user_id = sh.user_id
WHERE sh.user_id = vl.user_id
  AND (vl.features IS NULL OR NOT (vl.features ? 'halls'));