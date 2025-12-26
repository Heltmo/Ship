-- Eligibility System Migration
-- Adds auto-computed eligibility tracking and gated liking functionality

-- ============================================================================
-- ADD MISSING COLUMNS
-- ============================================================================

-- Add role_intent column if it doesn't exist
ALTER TABLE public.users_profile
ADD COLUMN IF NOT EXISTS role_intent TEXT;

-- Add is_eligible column to users_profile
ALTER TABLE public.users_profile
ADD COLUMN IF NOT EXISTS is_eligible BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_users_profile_is_eligible
ON public.users_profile(is_eligible, updated_at DESC);

-- ============================================================================
-- ELIGIBILITY COMPUTATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.recompute_user_eligibility(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role_intent TEXT;
  v_timezone TEXT;
  v_availability INTEGER;
  v_skill_count INTEGER;
  v_portfolio_count INTEGER;
  v_is_eligible BOOLEAN;
BEGIN
  -- Get profile fields
  SELECT role_intent, timezone, availability_hours_per_week
  INTO v_role_intent, v_timezone, v_availability
  FROM public.users_profile
  WHERE id = p_user_id;

  -- Count skills
  SELECT COUNT(*)
  INTO v_skill_count
  FROM public.user_skills
  WHERE user_id = p_user_id;

  -- Count portfolio items
  SELECT COUNT(*)
  INTO v_portfolio_count
  FROM public.portfolio_items
  WHERE user_id = p_user_id;

  -- Compute eligibility (all 5 requirements must be met)
  v_is_eligible := (
    v_role_intent IS NOT NULL AND v_role_intent != '' AND
    v_timezone IS NOT NULL AND v_timezone != '' AND
    v_availability IS NOT NULL AND v_availability > 0 AND
    v_skill_count >= 5 AND
    v_portfolio_count >= 2
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
-- TRIGGERS FOR AUTO-RECOMPUTATION
-- ============================================================================

-- Trigger on users_profile changes
CREATE OR REPLACE FUNCTION public.trigger_recompute_eligibility_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.recompute_user_eligibility(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_users_profile_change ON public.users_profile;
CREATE TRIGGER on_users_profile_change
AFTER INSERT OR UPDATE OF role_intent, timezone, availability_hours_per_week
ON public.users_profile
FOR EACH ROW
EXECUTE FUNCTION public.trigger_recompute_eligibility_profile();

-- Trigger on user_skills changes
CREATE OR REPLACE FUNCTION public.trigger_recompute_eligibility_skills()
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

DROP TRIGGER IF EXISTS on_user_skills_change ON public.user_skills;
CREATE TRIGGER on_user_skills_change
AFTER INSERT OR UPDATE OR DELETE
ON public.user_skills
FOR EACH ROW
EXECUTE FUNCTION public.trigger_recompute_eligibility_skills();

-- Trigger on portfolio_items changes
CREATE OR REPLACE FUNCTION public.trigger_recompute_eligibility_portfolio()
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

DROP TRIGGER IF EXISTS on_portfolio_items_change ON public.portfolio_items;
CREATE TRIGGER on_portfolio_items_change
AFTER INSERT OR UPDATE OR DELETE
ON public.portfolio_items
FOR EACH ROW
EXECUTE FUNCTION public.trigger_recompute_eligibility_portfolio();

-- ============================================================================
-- UPDATE RLS POLICIES
-- ============================================================================

-- Drop old users_profile SELECT policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users_profile;

-- New policy: anyone can see eligible profiles OR their own profile
CREATE POLICY "Eligible profiles viewable by all, own profile always viewable"
ON public.users_profile FOR SELECT
TO authenticated
USING (is_eligible = TRUE OR id = auth.uid());

-- ============================================================================
-- RPC: FEED PEOPLE
-- ============================================================================

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
  role_intent TEXT,
  availability_hours_per_week INTEGER,
  github_url TEXT,
  linkedin_url TEXT,
  skill_count BIGINT,
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
    up.timezone,
    up.role_intent,
    up.availability_hours_per_week,
    up.github_url,
    up.linkedin_url,
    COALESCE(
      (SELECT COUNT(*) FROM public.user_skills WHERE user_id = up.id),
      0
    ) AS skill_count,
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
-- RPC: PASS USER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.rpc_pass_user(p_target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_actor_id UUID;
BEGIN
  -- Get current user
  v_actor_id := auth.uid();

  IF v_actor_id IS NULL THEN
    RETURN json_build_object('error', 'Not authenticated');
  END IF;

  -- Prevent self-pass
  IF v_actor_id = p_target_user_id THEN
    RETURN json_build_object('error', 'Cannot pass yourself');
  END IF;

  -- Insert or update pass interaction
  INSERT INTO public.interactions (
    actor_user_id,
    target_type,
    target_id,
    action
  )
  VALUES (
    v_actor_id,
    'user',
    p_target_user_id,
    'pass'
  )
  ON CONFLICT (actor_user_id, target_type, target_id, action)
  DO NOTHING;

  RETURN json_build_object('success', TRUE);
END;
$$;

-- ============================================================================
-- RPC: LIKE USER (WITH ELIGIBILITY CHECK + MATCH CREATION)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.rpc_like_user(p_target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_actor_id UUID;
  v_actor_eligible BOOLEAN;
  v_mutual_like_exists BOOLEAN;
  v_match_id UUID;
  v_thread_id UUID;
  v_created_new_match BOOLEAN;
  v_existing_match UUID;
BEGIN
  -- Get current user
  v_actor_id := auth.uid();

  IF v_actor_id IS NULL THEN
    RETURN json_build_object('error', 'NOT_AUTHENTICATED');
  END IF;

  -- Prevent self-like
  IF v_actor_id = p_target_user_id THEN
    RETURN json_build_object('error', 'CANNOT_LIKE_YOURSELF');
  END IF;

  -- Check if actor is eligible
  SELECT is_eligible INTO v_actor_eligible
  FROM public.users_profile
  WHERE id = v_actor_id;

  IF v_actor_eligible IS NULL OR v_actor_eligible = FALSE THEN
    RETURN json_build_object('error', 'LIKES_LOCKED');
  END IF;

  -- Insert like interaction
  INSERT INTO public.interactions (
    actor_user_id,
    target_type,
    target_id,
    action
  )
  VALUES (
    v_actor_id,
    'user',
    p_target_user_id,
    'like'
  )
  ON CONFLICT (actor_user_id, target_type, target_id, action)
  DO NOTHING;

  -- Check for mutual like
  SELECT EXISTS (
    SELECT 1
    FROM public.interactions
    WHERE actor_user_id = p_target_user_id
      AND target_type = 'user'
      AND target_id = v_actor_id
      AND action = 'like'
  ) INTO v_mutual_like_exists;

  -- If no mutual like, return early
  IF NOT v_mutual_like_exists THEN
    RETURN json_build_object(
      'success', TRUE,
      'matched', FALSE
    );
  END IF;

  -- Check if match already exists
  SELECT id INTO v_existing_match
  FROM public.matches
  WHERE match_type = 'user_user'
    AND (
      (user_a_id = v_actor_id AND user_b_id = p_target_user_id) OR
      (user_a_id = p_target_user_id AND user_b_id = v_actor_id)
    )
  LIMIT 1;

  IF v_existing_match IS NOT NULL THEN
    -- Match already exists
    RETURN json_build_object(
      'success', TRUE,
      'matched', TRUE,
      'match_id', v_existing_match,
      'created_new_match', FALSE
    );
  END IF;

  -- Create new match
  INSERT INTO public.matches (
    match_type,
    user_a_id,
    user_b_id,
    status,
    matched_at
  )
  VALUES (
    'user_user',
    v_actor_id,
    p_target_user_id,
    'matched',
    NOW()
  )
  RETURNING id INTO v_match_id;

  -- Create thread
  INSERT INTO public.threads (
    match_id,
    last_message_at
  )
  VALUES (
    v_match_id,
    NOW()
  )
  RETURNING id INTO v_thread_id;

  -- Add participants
  INSERT INTO public.thread_participants (thread_id, user_id)
  VALUES
    (v_thread_id, v_actor_id),
    (v_thread_id, p_target_user_id);

  -- Post system message
  INSERT INTO public.messages (
    thread_id,
    sender_user_id,
    content
  )
  VALUES (
    v_thread_id,
    NULL, -- System message
    '🎉 You''ve matched! Time to align on the details:

**1. What are we building?**
Describe the product/project idea

**2. What is the 7-14 day deliverable?**
What will we ship in the first sprint?

**3. Roles + responsibilities**
Who does what?

**4. Weekly hours**
How much time can each person commit?

**5. Working style (async/sync)**
Preferred communication and collaboration style

---
Use this thread to align on these points before you start building together.'
  );

  RETURN json_build_object(
    'success', TRUE,
    'matched', TRUE,
    'match_id', v_match_id,
    'thread_id', v_thread_id,
    'created_new_match', TRUE
  );
END;
$$;

-- ============================================================================
-- ADDITIONAL INDEXES
-- ============================================================================

-- Index for efficient interaction lookups
CREATE INDEX IF NOT EXISTS idx_interactions_actor_target_action
ON public.interactions(actor_user_id, target_id, action);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.recompute_user_eligibility TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_feed_people TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_pass_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_like_user TO authenticated;

-- ============================================================================
-- RECOMPUTE ELIGIBILITY FOR ALL EXISTING USERS
-- ============================================================================

-- Recompute eligibility for all existing users
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM public.users_profile LOOP
    PERFORM public.recompute_user_eligibility(user_record.id);
  END LOOP;
END $$;
