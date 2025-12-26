-- Simplify Eligibility System - GitHub + 2 Repos Only
-- Updates eligibility criteria to ONLY require:
-- 1. GitHub connection (user_identities)
-- 2. At least 2 portfolio items (repos)

-- ============================================================================
-- UPDATE ELIGIBILITY COMPUTATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.recompute_user_eligibility(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_has_github BOOLEAN;
  v_portfolio_count INTEGER;
  v_is_eligible BOOLEAN;
BEGIN
  -- Check if user has connected GitHub
  SELECT EXISTS (
    SELECT 1
    FROM public.user_identities
    WHERE user_id = p_user_id AND provider = 'github'
  ) INTO v_has_github;

  -- Count portfolio items (GitHub repos)
  SELECT COUNT(*)
  INTO v_portfolio_count
  FROM public.portfolio_items
  WHERE user_id = p_user_id;

  -- Compute eligibility: GitHub connected + 2+ repos
  v_is_eligible := (v_has_github AND v_portfolio_count >= 2);

  -- Update the profile
  UPDATE public.users_profile
  SET is_eligible = v_is_eligible,
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN v_is_eligible;
END;
$$;

-- ============================================================================
-- UPDATE TRIGGERS - REMOVE UNNECESSARY ONES
-- ============================================================================

-- Drop old trigger on users_profile (no longer need to watch role_intent, timezone, availability)
DROP TRIGGER IF EXISTS on_users_profile_change ON public.users_profile;

-- Drop old trigger on user_skills (no longer relevant)
DROP TRIGGER IF EXISTS on_user_skills_change ON public.user_skills;

-- Keep portfolio_items trigger (already exists, no changes needed)
-- It will continue to trigger on INSERT/UPDATE/DELETE of portfolio items

-- Add NEW trigger on user_identities (for GitHub connections)
CREATE OR REPLACE FUNCTION public.trigger_recompute_eligibility_identities()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recompute_user_eligibility(OLD.user_id);
  ELSE
    PERFORM public.recompute_user_eligibility(NEW.user_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS on_user_identities_change ON public.user_identities;
CREATE TRIGGER on_user_identities_change
AFTER INSERT OR UPDATE OR DELETE
ON public.user_identities
FOR EACH ROW
EXECUTE FUNCTION public.trigger_recompute_eligibility_identities();

-- ============================================================================
-- UPDATE RPC: FEED PEOPLE (remove unnecessary fields)
-- ============================================================================

-- Drop the existing function first since we're changing the return type
DROP FUNCTION IF EXISTS public.rpc_feed_people(INT, INT);

CREATE OR REPLACE FUNCTION public.rpc_feed_people(
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  headline TEXT,
  bio TEXT,
  location TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  avatar_url TEXT,
  portfolio_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.id,
    up.full_name,
    up.headline,
    up.bio,
    up.location,
    up.github_url,
    up.linkedin_url,
    up.avatar_url,
    COALESCE(
      (SELECT COUNT(*) FROM public.portfolio_items WHERE user_id = up.id),
      0
    ) AS portfolio_count
  FROM public.users_profile up
  WHERE up.is_eligible = TRUE
    AND up.id != auth.uid() -- Exclude viewer
  ORDER BY up.updated_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- ============================================================================
-- RECOMPUTE ELIGIBILITY FOR ALL EXISTING USERS
-- ============================================================================

-- Recompute eligibility with new simplified logic
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM public.users_profile LOOP
    PERFORM public.recompute_user_eligibility(user_record.id);
  END LOOP;
END $$;
