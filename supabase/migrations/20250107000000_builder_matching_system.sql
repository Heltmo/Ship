-- Builder Matching System Migration
-- Adds comprehensive builder profile fields and match scoring algorithm
--
-- This migration:
-- 1. Adds new columns for builder preferences (work mode, iteration style, stack, tools, goals)
-- 2. Updates eligibility function to require builder profile completion
-- 3. Creates match scoring algorithm (0-100 points across 5 categories)
-- 4. Updates rpc_feed_people to return scored and ranked matches

-- ============================================================================
-- ADD NEW COLUMNS TO USERS_PROFILE
-- ============================================================================

-- Convert existing TEXT[] columns to JSONB or create new JSONB columns
DO $$
BEGIN
  -- Check if work_best_mode exists and convert if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'users_profile'
    AND column_name = 'work_best_mode'
    AND data_type = 'ARRAY'
  ) THEN
    -- Convert TEXT[] to JSONB
    ALTER TABLE public.users_profile
    ALTER COLUMN work_best_mode DROP DEFAULT;
    ALTER TABLE public.users_profile
    ALTER COLUMN work_best_mode TYPE JSONB
    USING to_jsonb(work_best_mode);
    ALTER TABLE public.users_profile
    ALTER COLUMN work_best_mode SET DEFAULT '[]'::jsonb;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'users_profile'
    AND column_name = 'work_best_mode'
  ) THEN
    -- Create new JSONB column
    ALTER TABLE public.users_profile
    ADD COLUMN work_best_mode JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Check if stack_focus exists and convert if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'users_profile'
    AND column_name = 'stack_focus'
    AND data_type = 'ARRAY'
  ) THEN
    -- Convert TEXT[] to JSONB
    ALTER TABLE public.users_profile
    ALTER COLUMN stack_focus DROP DEFAULT;
    ALTER TABLE public.users_profile
    ALTER COLUMN stack_focus TYPE JSONB
    USING to_jsonb(stack_focus);
    ALTER TABLE public.users_profile
    ALTER COLUMN stack_focus SET DEFAULT '[]'::jsonb;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'users_profile'
    AND column_name = 'stack_focus'
  ) THEN
    -- Create new JSONB column
    ALTER TABLE public.users_profile
    ADD COLUMN stack_focus JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

COMMENT ON COLUMN public.users_profile.work_best_mode IS
  'Array of work preferences: solo_deep_work, pair_programming, async_communication, real_time_collaboration';

COMMENT ON COLUMN public.users_profile.stack_focus IS
  'Array: web, mobile, ai, game, backend, tooling';

-- Iteration style (vibe_coder vs regular_coder)
ALTER TABLE public.users_profile
ADD COLUMN IF NOT EXISTS iteration_style TEXT;

COMMENT ON COLUMN public.users_profile.iteration_style IS
  'vibe_coder (fast & messy) vs regular_coder (slow & polished)';

-- Add constraint for iteration_style
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'iteration_style_check'
  ) THEN
    ALTER TABLE public.users_profile
    ADD CONSTRAINT iteration_style_check
    CHECK (iteration_style IN ('vibe_coder', 'regular_coder') OR iteration_style IS NULL);
  END IF;
END $$;

-- Primary tools array (cursor, vscode, replit, claude, chatgpt, etc.)
ALTER TABLE public.users_profile
ADD COLUMN IF NOT EXISTS primary_tools JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.users_profile.primary_tools IS
  'Array: cursor, vscode, replit, claude, chatgpt, windsurf, vim, other';

-- What user wants to build next (free text)
ALTER TABLE public.users_profile
ADD COLUMN IF NOT EXISTS want_to_build_next TEXT;

COMMENT ON COLUMN public.users_profile.want_to_build_next IS
  'Free text describing what the user wants to build next (10-500 chars)';

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
  v_has_timezone BOOLEAN;
  v_has_availability BOOLEAN;
  v_has_work_mode BOOLEAN;
  v_has_iteration_style BOOLEAN;
  v_has_stack_focus BOOLEAN;
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

  -- Check builder profile completeness
  SELECT
    (timezone IS NOT NULL AND timezone != ''),
    (availability_hours_per_week IS NOT NULL AND availability_hours_per_week > 0),
    (work_best_mode IS NOT NULL AND jsonb_array_length(work_best_mode) > 0),
    (iteration_style IS NOT NULL AND iteration_style != ''),
    (stack_focus IS NOT NULL AND jsonb_array_length(stack_focus) > 0)
  INTO
    v_has_timezone,
    v_has_availability,
    v_has_work_mode,
    v_has_iteration_style,
    v_has_stack_focus
  FROM public.users_profile
  WHERE id = p_user_id;

  -- Compute eligibility: ALL requirements must be met
  v_is_eligible := (
    v_has_github AND
    v_portfolio_count >= 2 AND
    v_has_timezone AND
    v_has_availability AND
    v_has_work_mode AND
    v_has_iteration_style AND
    v_has_stack_focus
  );

  -- Update the profile
  UPDATE public.users_profile
  SET is_eligible = v_is_eligible,
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN v_is_eligible;
END;
$$;

-- ============================================================================
-- CREATE MATCH SCORING FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.rpc_calculate_match_score(
  viewer_id UUID,
  target_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile RECORD;
  t_profile RECORD;
  v_score INTEGER := 0;

  -- Timezone scoring variables
  v_tz_offset INTERVAL;
  t_tz_offset INTERVAL;
  tz_diff_hours NUMERIC;
  tz_score INTEGER := 0;

  -- Availability scoring variables
  avail_diff INTEGER;
  avail_score INTEGER := 0;

  -- Stack overlap scoring
  stack_overlap INTEGER;
  stack_score INTEGER := 0;

  -- Work style scoring
  work_overlap INTEGER;
  work_score INTEGER := 0;

  -- Iteration style scoring
  iter_score INTEGER := 0;
BEGIN
  -- Get viewer and target profiles
  SELECT
    timezone,
    availability_hours_per_week,
    work_best_mode,
    iteration_style,
    stack_focus
  INTO v_profile
  FROM public.users_profile
  WHERE id = viewer_id;

  SELECT
    timezone,
    availability_hours_per_week,
    work_best_mode,
    iteration_style,
    stack_focus
  INTO t_profile
  FROM public.users_profile
  WHERE id = target_id;

  -- =========================================================================
  -- 1. TIMEZONE OVERLAP (0-30 points)
  -- =========================================================================
  -- Calculate timezone offsets from UTC and find the difference in hours
  BEGIN
    -- Get UTC offsets for both timezones
    SELECT
      EXTRACT(EPOCH FROM (now() AT TIME ZONE v_profile.timezone - now() AT TIME ZONE 'UTC')) / 3600,
      EXTRACT(EPOCH FROM (now() AT TIME ZONE t_profile.timezone - now() AT TIME ZONE 'UTC')) / 3600
    INTO v_tz_offset, t_tz_offset;

    -- Calculate absolute difference in hours
    tz_diff_hours := ABS(EXTRACT(EPOCH FROM v_tz_offset)::NUMERIC - EXTRACT(EPOCH FROM t_tz_offset)::NUMERIC);

    -- Score based on timezone proximity
    IF tz_diff_hours = 0 THEN
      tz_score := 30; -- Same timezone
    ELSIF tz_diff_hours <= 2 THEN
      tz_score := 30; -- Within 2 hours (very compatible)
    ELSIF tz_diff_hours <= 5 THEN
      tz_score := 20; -- Within 5 hours (some overlap)
    ELSIF tz_diff_hours <= 8 THEN
      tz_score := 10; -- Same broad region
    ELSE
      tz_score := 0; -- Minimal overlap
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- If timezone calculation fails, assign 0 points
      tz_score := 0;
  END;

  -- =========================================================================
  -- 2. AVAILABILITY SIMILARITY (0-20 points)
  -- =========================================================================
  -- Compare hours per week availability
  IF v_profile.availability_hours_per_week IS NOT NULL AND
     t_profile.availability_hours_per_week IS NOT NULL THEN
    avail_diff := ABS(v_profile.availability_hours_per_week - t_profile.availability_hours_per_week);

    IF avail_diff <= 5 THEN
      avail_score := 20; -- Very similar availability
    ELSIF avail_diff <= 10 THEN
      avail_score := 15; -- Moderately similar
    ELSIF avail_diff <= 20 THEN
      avail_score := 10; -- Somewhat similar
    ELSE
      avail_score := 5; -- Different availability levels
    END IF;
  ELSE
    avail_score := 0; -- Missing data
  END IF;

  -- =========================================================================
  -- 3. STACK OVERLAP (0-25 points)
  -- =========================================================================
  -- Count shared stack_focus items
  IF v_profile.stack_focus IS NOT NULL AND
     t_profile.stack_focus IS NOT NULL THEN
    SELECT COUNT(*) INTO stack_overlap
    FROM (
      SELECT jsonb_array_elements_text(v_profile.stack_focus) AS stack
      INTERSECT
      SELECT jsonb_array_elements_text(t_profile.stack_focus) AS stack
    ) AS stack_matches;

    -- Each shared stack: +8 points (capped at 25)
    stack_score := LEAST(stack_overlap * 8, 25);
  ELSE
    stack_score := 0;
  END IF;

  -- =========================================================================
  -- 4. WORK STYLE MATCH (0-15 points)
  -- =========================================================================
  -- Count shared work_best_mode items
  IF v_profile.work_best_mode IS NOT NULL AND
     t_profile.work_best_mode IS NOT NULL THEN
    SELECT COUNT(*) INTO work_overlap
    FROM (
      SELECT jsonb_array_elements_text(v_profile.work_best_mode) AS mode
      INTERSECT
      SELECT jsonb_array_elements_text(t_profile.work_best_mode) AS mode
    ) AS work_matches;

    -- Each shared work mode: +5 points (capped at 15)
    work_score := LEAST(work_overlap * 5, 15);
  ELSE
    work_score := 0;
  END IF;

  -- =========================================================================
  -- 5. ITERATION STYLE (0-10 points)
  -- =========================================================================
  -- Exact match: vibe_coder with vibe_coder, or regular_coder with regular_coder
  IF v_profile.iteration_style IS NOT NULL AND
     t_profile.iteration_style IS NOT NULL AND
     v_profile.iteration_style = t_profile.iteration_style THEN
    iter_score := 10;
  ELSE
    iter_score := 0;
  END IF;

  -- =========================================================================
  -- CALCULATE TOTAL SCORE (0-100)
  -- =========================================================================
  v_score := tz_score + avail_score + stack_score + work_score + iter_score;

  RETURN v_score;
END;
$$;

-- ============================================================================
-- UPDATE RPC_FEED_PEOPLE TO INCLUDE MATCH SCORING
-- ============================================================================

-- Drop the existing function first
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
  timezone TEXT,
  availability_hours_per_week INTEGER,
  work_best_mode JSONB,
  iteration_style TEXT,
  stack_focus JSONB,
  want_to_build_next TEXT,
  allow_messages BOOLEAN,
  github_url TEXT,
  linkedin_url TEXT,
  avatar_url TEXT,
  portfolio_count BIGINT,
  match_score INTEGER,
  match_strength TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH scored_users AS (
    SELECT
      up.id,
      up.full_name,
      up.headline,
      up.bio,
      up.location,
      up.timezone,
      up.availability_hours_per_week,
      up.work_best_mode,
      up.iteration_style,
      up.stack_focus,
      up.want_to_build_next,
      up.allow_messages,
      up.github_url,
      up.linkedin_url,
      up.avatar_url,
      COALESCE(
        (SELECT COUNT(*) FROM public.portfolio_items WHERE user_id = up.id),
        0
      ) AS portfolio_count,
      public.rpc_calculate_match_score(auth.uid(), up.id) AS match_score
    FROM public.users_profile up
    WHERE up.is_eligible = TRUE
      AND up.id != auth.uid() -- Exclude viewer
  )
  SELECT
    su.id,
    su.full_name,
    su.headline,
    su.bio,
    su.location,
    su.timezone,
    su.availability_hours_per_week,
    su.work_best_mode,
    su.iteration_style,
    su.stack_focus,
    su.want_to_build_next,
    su.allow_messages,
    su.github_url,
    su.linkedin_url,
    su.avatar_url,
    su.portfolio_count,
    su.match_score,
    CASE
      WHEN su.match_score >= 70 THEN 'strong'::TEXT
      WHEN su.match_score >= 45 THEN 'medium'::TEXT
      ELSE 'wildcard'::TEXT
    END AS match_strength
  FROM scored_users su
  ORDER BY su.match_score DESC, su.id DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- ============================================================================
-- UPDATE TRIGGERS (already exist from previous migration)
-- ============================================================================

-- The trigger on user_identities already exists from 20250104 migration
-- The trigger on portfolio_items already exists from previous migrations
-- These will automatically call recompute_user_eligibility when data changes

-- Add trigger for builder profile field changes
DROP TRIGGER IF EXISTS on_builder_profile_change ON public.users_profile;

CREATE OR REPLACE FUNCTION public.trigger_recompute_eligibility_builder()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Recompute eligibility when builder profile fields change
  PERFORM public.recompute_user_eligibility(NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_builder_profile_change
AFTER UPDATE OF timezone, availability_hours_per_week, work_best_mode, iteration_style, stack_focus
ON public.users_profile
FOR EACH ROW
EXECUTE FUNCTION public.trigger_recompute_eligibility_builder();

-- ============================================================================
-- RECOMPUTE ELIGIBILITY FOR ALL EXISTING USERS
-- ============================================================================

-- This will mark all existing users as ineligible until they complete builder profile
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM public.users_profile LOOP
    PERFORM public.recompute_user_eligibility(user_record.id);
  END LOOP;
END $$;

-- ============================================================================
-- ADD HELPFUL COMMENTS
-- ============================================================================

COMMENT ON FUNCTION public.rpc_calculate_match_score IS
  'Calculates compatibility score (0-100) between viewer and target user based on timezone, availability, stack, work style, and iteration style';

COMMENT ON FUNCTION public.rpc_feed_people IS
  'Returns eligible users ordered by match score with strength labels (strong/medium/wildcard)';
