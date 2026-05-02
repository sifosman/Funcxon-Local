-- Add audience column to blog_posts for targeting specific user groups
ALTER TABLE public.blog_posts
ADD COLUMN IF NOT EXISTS audience TEXT NOT NULL DEFAULT 'all' CHECK (audience IN ('all', 'listers', 'vendors', 'attendees'));

-- Create index for audience filtering
CREATE INDEX IF NOT EXISTS idx_blog_posts_audience ON public.blog_posts (audience) WHERE is_published = TRUE;

-- Update existing blog posts to have 'all' audience (default)
UPDATE public.blog_posts SET audience = 'all' WHERE audience IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.blog_posts.audience IS 'Target audience for the blog post: all, listers, vendors, or attendees';
