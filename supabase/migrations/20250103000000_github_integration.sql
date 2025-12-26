-- GitHub Integration Migration
-- Adds user_identities table and enhances portfolio_items for GitHub repo imports

-- ============================================================================
-- CREATE USER_IDENTITIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('github')),
  provider_user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  profile_url TEXT,
  avatar_url TEXT,
  connected_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, provider)
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_user_identities_user_id
ON public.user_identities(user_id);

-- ============================================================================
-- ALTER PORTFOLIO_ITEMS TABLE
-- ============================================================================

-- Add type column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'portfolio_items'
    AND column_name = 'type'
  ) THEN
    ALTER TABLE public.portfolio_items
    ADD COLUMN type TEXT NOT NULL DEFAULT 'link'
    CHECK (type IN ('link', 'github_repo'));
  END IF;
END $$;

-- Add metadata column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'portfolio_items'
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.portfolio_items
    ADD COLUMN metadata JSONB;
  END IF;
END $$;

-- Add unique constraint on user_id + url to prevent duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'portfolio_items_user_id_url_key'
  ) THEN
    ALTER TABLE public.portfolio_items
    ADD CONSTRAINT portfolio_items_user_id_url_key
    UNIQUE(user_id, url);
  END IF;
END $$;

-- ============================================================================
-- RLS POLICIES FOR USER_IDENTITIES
-- ============================================================================

ALTER TABLE public.user_identities ENABLE ROW LEVEL SECURITY;

-- Users can view their own identities
CREATE POLICY "Users can view their own identities"
ON public.user_identities FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own identities
CREATE POLICY "Users can insert their own identities"
ON public.user_identities FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own identities
CREATE POLICY "Users can update their own identities"
ON public.user_identities FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own identities
CREATE POLICY "Users can delete their own identities"
ON public.user_identities FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT ALL ON public.user_identities TO authenticated;
