-- Make vendor image_url and description nullable to match the profile update form,
-- which allows users to create/update their vendor portfolio without forcing an image or description.
ALTER TABLE public.vendors ALTER COLUMN image_url DROP NOT NULL;
ALTER TABLE public.vendors ALTER COLUMN description DROP NOT NULL;
