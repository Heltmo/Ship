-- TeamMatch Database Schema Migration
-- This migration sets up the complete database schema for the TeamMatch platform
-- including user profiles, projects, matching, messaging, and reputation systems.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================================
-- CORE USER TABLES
-- ============================================================================

-- User profiles (extends auth.users)
CREATE TABLE public.users_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  headline TEXT, -- e.g., "Full-stack engineer, ex-FAANG"
  bio TEXT,
  location TEXT,
  timezone TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  twitter_url TEXT,
  website_url TEXT,

  -- Profile state
  onboarding_completed BOOLEAN DEFAULT FALSE,
  profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private')),

  -- Matching preferences
  role_intent TEXT CHECK (role_intent IN ('looking_for_cofounder', 'looking_for_projects', 'both')),
  looking_for_cofounder BOOLEAN DEFAULT FALSE,
  looking_for_projects BOOLEAN DEFAULT FALSE,
  availability_hours_per_week INTEGER,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_availability CHECK (availability_hours_per_week >= 0 AND availability_hours_per_week <= 168)
);

-- Skills master table
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  category TEXT, -- e.g., 'programming', 'design', 'marketing'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User skills junction table
CREATE TABLE public.user_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  proficiency_level TEXT CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  years_of_experience INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, skill_id)
);

-- Portfolio items (proof of work)
CREATE TABLE public.portfolio_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT, -- Link to live project, GitHub repo, etc.
  image_url TEXT,
  project_type TEXT, -- e.g., 'web_app', 'mobile_app', 'open_source', 'design'
  tags TEXT[], -- Array of tags
  is_featured BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PROJECT TABLES
-- ============================================================================

-- Projects (for recruiting mode)
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_user_id UUID NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  pitch TEXT, -- Elevator pitch
  problem_statement TEXT,
  solution_statement TEXT,
  target_audience TEXT,

  -- Deliverable requirements (7-14 day sprint)
  deliverable_description TEXT NOT NULL,
  deliverable_timeline_days INTEGER NOT NULL CHECK (deliverable_timeline_days >= 7 AND deliverable_timeline_days <= 14),

  -- Project details
  stage TEXT CHECK (stage IN ('idea', 'prototype', 'mvp', 'growth', 'scaling')),
  commitment_level TEXT CHECK (commitment_level IN ('part_time', 'full_time', 'flexible')),
  equity_offered TEXT, -- e.g., "0.5-2%", "TBD", "None (paid)"
  compensation_type TEXT CHECK (compensation_type IN ('equity_only', 'paid_only', 'equity_and_paid')),

  -- State
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'closed')),
  is_accepting_applications BOOLEAN DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project roles/positions needed
CREATE TABLE public.project_roles_needed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  role_title TEXT NOT NULL, -- e.g., "Frontend Engineer", "UI/UX Designer"
  role_description TEXT,
  required_skills UUID[], -- Array of skill IDs
  time_commitment_hours_per_week INTEGER,
  is_filled BOOLEAN DEFAULT FALSE,
  filled_by_user_id UUID REFERENCES public.users_profile(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INTERACTION & MATCHING TABLES
-- ============================================================================

-- User interactions (likes, passes, saves, applications)
CREATE TABLE public.interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_user_id UUID NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,

  -- Polymorphic target (user or project)
  target_type TEXT NOT NULL CHECK (target_type IN ('user', 'project')),
  target_id UUID NOT NULL, -- References either users_profile.id or projects.id

  -- Action type
  action TEXT NOT NULL CHECK (action IN ('like', 'pass', 'save', 'apply')),

  -- Optional application data
  application_message TEXT, -- For 'apply' actions

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure user can only interact with a target once per action type
  UNIQUE(actor_user_id, target_type, target_id, action)
);

-- Matches (mutual likes or accepted applications)
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Match type
  match_type TEXT NOT NULL CHECK (match_type IN ('user_user', 'user_project')),

  -- For user-user matches (cofounder matching)
  user_a_id UUID REFERENCES public.users_profile(id) ON DELETE CASCADE,
  user_b_id UUID REFERENCES public.users_profile(id) ON DELETE CASCADE,

  -- For user-project matches (recruiting)
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  candidate_user_id UUID REFERENCES public.users_profile(id) ON DELETE CASCADE,
  owner_user_id UUID REFERENCES public.users_profile(id) ON DELETE CASCADE,

  -- Match state
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'closed')),

  -- Metadata
  matched_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints to ensure valid match configurations
  CONSTRAINT valid_user_user_match CHECK (
    (match_type = 'user_user' AND user_a_id IS NOT NULL AND user_b_id IS NOT NULL AND project_id IS NULL AND candidate_user_id IS NULL AND owner_user_id IS NULL)
  ),
  CONSTRAINT valid_user_project_match CHECK (
    (match_type = 'user_project' AND project_id IS NOT NULL AND candidate_user_id IS NOT NULL AND owner_user_id IS NOT NULL AND user_a_id IS NULL AND user_b_id IS NULL)
  ),
  CONSTRAINT no_self_match CHECK (user_a_id != user_b_id)
);

-- ============================================================================
-- MESSAGING TABLES
-- ============================================================================

-- Conversation threads
CREATE TABLE public.threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Optional reference to the match that created this thread
  match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,

  -- Thread metadata
  title TEXT, -- Optional thread title
  last_message_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Thread participants
CREATE TABLE public.thread_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,

  -- Participant state
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,
  is_archived BOOLEAN DEFAULT FALSE,

  UNIQUE(thread_id, user_id)
);

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  sender_user_id UUID REFERENCES public.users_profile(id) ON DELETE CASCADE, -- Nullable for system messages

  -- Message content
  content TEXT NOT NULL,

  -- Optional attachments
  attachments JSONB, -- Array of {url, type, name}

  -- Message state
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT content_not_empty CHECK (LENGTH(TRIM(content)) > 0)
);

-- ============================================================================
-- SPRINT & DELIVERABLE TRACKING
-- ============================================================================

-- Sprints (7-14 day work cycles)
CREATE TABLE public.sprints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Sprint ownership
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,

  -- Sprint details
  title TEXT NOT NULL,
  description TEXT,
  goals TEXT[],

  -- Timeline
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_days INTEGER GENERATED ALWAYS AS (end_date - start_date) STORED,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_sprint_duration CHECK (end_date > start_date),
  CONSTRAINT valid_duration_range CHECK ((end_date - start_date) >= 7 AND (end_date - start_date) <= 14)
);

-- Sprint check-ins (progress updates)
CREATE TABLE public.sprint_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sprint_id UUID NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,

  -- Check-in content
  summary TEXT NOT NULL,
  progress_notes TEXT,
  blockers TEXT,
  next_steps TEXT,

  -- Metrics
  hours_worked DECIMAL(5,2),
  completion_percentage INTEGER CHECK (completion_percentage >= 0 AND completion_percentage <= 100),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sprint artifacts (deliverables, proof of work)
CREATE TABLE public.sprint_artifacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sprint_id UUID NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,

  -- Artifact details
  title TEXT NOT NULL,
  description TEXT,
  artifact_type TEXT CHECK (artifact_type IN ('code', 'design', 'document', 'video', 'other')),
  url TEXT, -- GitHub PR, Figma link, video demo, etc.

  -- Validation
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by_user_id UUID REFERENCES public.users_profile(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- REPUTATION & RELIABILITY TABLES
-- ============================================================================

-- Reputation signals (user reliability metrics)
CREATE TABLE public.reputation_signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,

  -- Response metrics
  response_rate DECIMAL(5,2) DEFAULT 0 CHECK (response_rate >= 0 AND response_rate <= 100),
  avg_response_time_hours DECIMAL(8,2),
  messages_sent_count INTEGER DEFAULT 0,
  messages_received_count INTEGER DEFAULT 0,

  -- Completion metrics
  completion_rate DECIMAL(5,2) DEFAULT 0 CHECK (completion_rate >= 0 AND completion_rate <= 100),
  sprints_completed_count INTEGER DEFAULT 0,
  sprints_started_count INTEGER DEFAULT 0,
  on_time_delivery_rate DECIMAL(5,2) DEFAULT 0 CHECK (on_time_delivery_rate >= 0 AND on_time_delivery_rate <= 100),

  -- Reliability score
  reliability_score DECIMAL(5,2) DEFAULT 0 CHECK (reliability_score >= 0 AND reliability_score <= 100),

  -- Negative signals
  reports_count INTEGER DEFAULT 0,
  ghost_count INTEGER DEFAULT 0, -- Times user stopped responding

  -- Calculation metadata
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- ============================================================================
-- VECTOR EMBEDDINGS FOR SEMANTIC SEARCH
-- ============================================================================

-- User embeddings for semantic matching
CREATE TABLE public.user_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,

  -- Embedding vector (1536 dimensions for OpenAI ada-002, adjust as needed)
  embedding vector(1536) NOT NULL,

  -- Source content that was embedded
  embedded_content TEXT, -- Concatenated profile data
  model_version TEXT DEFAULT 'text-embedding-ada-002',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- Project embeddings for semantic search
CREATE TABLE public.project_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,

  -- Embedding vector
  embedding vector(1536) NOT NULL,

  -- Source content that was embedded
  embedded_content TEXT, -- Concatenated project data
  model_version TEXT DEFAULT 'text-embedding-ada-002',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(project_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User profile indexes
CREATE INDEX idx_users_profile_email ON public.users_profile(email);
CREATE INDEX idx_users_profile_looking_for ON public.users_profile(looking_for_cofounder, looking_for_projects)
  WHERE profile_visibility = 'public';

-- Skills indexes
CREATE INDEX idx_user_skills_user_id ON public.user_skills(user_id);
CREATE INDEX idx_user_skills_skill_id ON public.user_skills(skill_id);

-- Portfolio indexes
CREATE INDEX idx_portfolio_items_user_id ON public.portfolio_items(user_id);
CREATE INDEX idx_portfolio_items_featured ON public.portfolio_items(user_id, is_featured);

-- Project indexes
CREATE INDEX idx_projects_owner_id ON public.projects(owner_user_id);
CREATE INDEX idx_projects_status ON public.projects(status) WHERE status = 'active';
CREATE INDEX idx_projects_accepting_applications ON public.projects(is_accepting_applications)
  WHERE is_accepting_applications = TRUE AND status = 'active';
CREATE INDEX idx_project_roles_project_id ON public.project_roles_needed(project_id);

-- Interaction indexes (for feed queries)
CREATE INDEX idx_interactions_actor ON public.interactions(actor_user_id, created_at DESC);
CREATE INDEX idx_interactions_target ON public.interactions(target_type, target_id);
CREATE INDEX idx_interactions_action ON public.interactions(action, target_type, created_at DESC);

-- Match indexes
CREATE INDEX idx_matches_user_a ON public.matches(user_a_id, status);
CREATE INDEX idx_matches_user_b ON public.matches(user_b_id, status);
CREATE INDEX idx_matches_project ON public.matches(project_id, status);
CREATE INDEX idx_matches_candidate ON public.matches(candidate_user_id, status);
CREATE INDEX idx_matches_type_status ON public.matches(match_type, status);

-- Thread indexes
CREATE INDEX idx_threads_match_id ON public.threads(match_id);
CREATE INDEX idx_threads_last_message ON public.threads(last_message_at DESC);

-- Thread participant indexes
CREATE INDEX idx_thread_participants_user ON public.thread_participants(user_id);
CREATE INDEX idx_thread_participants_thread ON public.thread_participants(thread_id);

-- Message indexes
CREATE INDEX idx_messages_thread ON public.messages(thread_id, created_at DESC);
CREATE INDEX idx_messages_sender ON public.messages(sender_user_id, created_at DESC);

-- Sprint indexes
CREATE INDEX idx_sprints_user ON public.sprints(user_id, status);
CREATE INDEX idx_sprints_project ON public.sprints(project_id, status);
CREATE INDEX idx_sprint_checkins_sprint ON public.sprint_checkins(sprint_id, created_at DESC);
CREATE INDEX idx_sprint_artifacts_sprint ON public.sprint_artifacts(sprint_id);

-- Reputation indexes
CREATE INDEX idx_reputation_user ON public.reputation_signals(user_id);
CREATE INDEX idx_reputation_score ON public.reputation_signals(reliability_score DESC);

-- Vector similarity search indexes (using HNSW for approximate nearest neighbor)
CREATE INDEX idx_user_embeddings_vector ON public.user_embeddings
  USING hnsw (embedding vector_cosine_ops);

CREATE INDEX idx_project_embeddings_vector ON public.project_embeddings
  USING hnsw (embedding vector_cosine_ops);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_roles_needed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprint_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprint_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_embeddings ENABLE ROW LEVEL SECURITY;

-- Users Profile Policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.users_profile FOR SELECT
  USING (profile_visibility = 'public' OR auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.users_profile FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users_profile FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
  ON public.users_profile FOR DELETE
  USING (auth.uid() = id);

-- Skills Policies (public read, admin write)
CREATE POLICY "Skills are viewable by everyone"
  ON public.skills FOR SELECT
  TO authenticated
  USING (true);

-- User Skills Policies
CREATE POLICY "User skills are viewable if profile is viewable"
  ON public.user_skills FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users_profile
      WHERE id = user_skills.user_id
      AND (profile_visibility = 'public' OR auth.uid() = id)
    )
  );

CREATE POLICY "Users can manage their own skills"
  ON public.user_skills FOR ALL
  USING (auth.uid() = user_id);

-- Portfolio Items Policies
CREATE POLICY "Portfolio items are viewable if profile is viewable"
  ON public.portfolio_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users_profile
      WHERE id = portfolio_items.user_id
      AND (profile_visibility = 'public' OR auth.uid() = id)
    )
  );

CREATE POLICY "Users can manage their own portfolio items"
  ON public.portfolio_items FOR ALL
  USING (auth.uid() = user_id);

-- Projects Policies
CREATE POLICY "Active projects are viewable by authenticated users"
  ON public.projects FOR SELECT
  TO authenticated
  USING (status = 'active' OR auth.uid() = owner_user_id);

CREATE POLICY "Users can manage their own projects"
  ON public.projects FOR ALL
  USING (auth.uid() = owner_user_id);

-- Project Roles Policies
CREATE POLICY "Project roles are viewable with their projects"
  ON public.project_roles_needed FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_roles_needed.project_id
      AND (status = 'active' OR auth.uid() = owner_user_id)
    )
  );

CREATE POLICY "Project owners can manage roles"
  ON public.project_roles_needed FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_roles_needed.project_id
      AND auth.uid() = owner_user_id
    )
  );

-- Interactions Policies
CREATE POLICY "Users can view their own interactions"
  ON public.interactions FOR SELECT
  USING (auth.uid() = actor_user_id);

CREATE POLICY "Users can create interactions"
  ON public.interactions FOR INSERT
  WITH CHECK (auth.uid() = actor_user_id);

CREATE POLICY "Users can delete their own interactions"
  ON public.interactions FOR DELETE
  USING (auth.uid() = actor_user_id);

-- Matches Policies
CREATE POLICY "Users can view their own matches"
  ON public.matches FOR SELECT
  USING (
    auth.uid() = user_a_id OR
    auth.uid() = user_b_id OR
    auth.uid() = candidate_user_id OR
    auth.uid() = owner_user_id
  );

CREATE POLICY "System can create matches"
  ON public.matches FOR INSERT
  WITH CHECK (
    auth.uid() = user_a_id OR
    auth.uid() = user_b_id OR
    auth.uid() = candidate_user_id OR
    auth.uid() = owner_user_id
  );

CREATE POLICY "Match participants can update match status"
  ON public.matches FOR UPDATE
  USING (
    auth.uid() = user_a_id OR
    auth.uid() = user_b_id OR
    auth.uid() = candidate_user_id OR
    auth.uid() = owner_user_id
  );

-- Threads Policies
CREATE POLICY "Users can view threads they participate in"
  ON public.threads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.thread_participants
      WHERE thread_id = threads.id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "System can create threads"
  ON public.threads FOR INSERT
  WITH CHECK (true);

-- Thread Participants Policies
CREATE POLICY "Users can view participants in their threads"
  ON public.thread_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.thread_participants tp
      WHERE tp.thread_id = thread_participants.thread_id
      AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "System can add thread participants"
  ON public.thread_participants FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own participant record"
  ON public.thread_participants FOR UPDATE
  USING (auth.uid() = user_id);

-- Messages Policies
CREATE POLICY "Thread participants can view messages"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.thread_participants
      WHERE thread_id = messages.thread_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Thread participants can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_user_id AND
    EXISTS (
      SELECT 1 FROM public.thread_participants
      WHERE thread_id = messages.thread_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages"
  ON public.messages FOR UPDATE
  USING (auth.uid() = sender_user_id);

-- Sprints Policies
CREATE POLICY "Users can view sprints they're involved in"
  ON public.sprints FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = sprints.project_id
      AND auth.uid() = owner_user_id
    )
  );

CREATE POLICY "Users can manage their own sprints"
  ON public.sprints FOR ALL
  USING (auth.uid() = user_id);

-- Sprint Checkins Policies
CREATE POLICY "Sprint participants can view checkins"
  ON public.sprint_checkins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sprints
      WHERE id = sprint_checkins.sprint_id
      AND (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.projects
        WHERE id = sprints.project_id
        AND auth.uid() = owner_user_id
      ))
    )
  );

CREATE POLICY "Users can create their own checkins"
  ON public.sprint_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own checkins"
  ON public.sprint_checkins FOR UPDATE
  USING (auth.uid() = user_id);

-- Sprint Artifacts Policies
CREATE POLICY "Sprint participants can view artifacts"
  ON public.sprint_artifacts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sprints
      WHERE id = sprint_artifacts.sprint_id
      AND (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.projects
        WHERE id = sprints.project_id
        AND auth.uid() = owner_user_id
      ))
    )
  );

CREATE POLICY "Users can manage their own artifacts"
  ON public.sprint_artifacts FOR ALL
  USING (auth.uid() = user_id);

-- Reputation Signals Policies
CREATE POLICY "Users can view all reputation signals"
  ON public.reputation_signals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage reputation signals"
  ON public.reputation_signals FOR ALL
  USING (true); -- In production, restrict this to a service role

-- User Embeddings Policies
CREATE POLICY "Users can view public user embeddings"
  ON public.user_embeddings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users_profile
      WHERE id = user_embeddings.user_id
      AND profile_visibility = 'public'
    )
  );

CREATE POLICY "System can manage user embeddings"
  ON public.user_embeddings FOR ALL
  USING (true); -- In production, restrict this to a service role

-- Project Embeddings Policies
CREATE POLICY "Users can view active project embeddings"
  ON public.project_embeddings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_embeddings.project_id
      AND status = 'active'
    )
  );

CREATE POLICY "System can manage project embeddings"
  ON public.project_embeddings FOR ALL
  USING (true); -- In production, restrict this to a service role

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_profile_updated_at BEFORE UPDATE ON public.users_profile
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_portfolio_items_updated_at BEFORE UPDATE ON public.portfolio_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_roles_updated_at BEFORE UPDATE ON public.project_roles_needed
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_threads_updated_at BEFORE UPDATE ON public.threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sprints_updated_at BEFORE UPDATE ON public.sprints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reputation_updated_at BEFORE UPDATE ON public.reputation_signals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_embeddings_updated_at BEFORE UPDATE ON public.user_embeddings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_embeddings_updated_at BEFORE UPDATE ON public.project_embeddings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update thread last_message_at when a new message is sent
CREATE OR REPLACE FUNCTION public.update_thread_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.threads
  SET last_message_at = NEW.created_at
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_thread_on_new_message AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_thread_last_message();

-- Function to create user profile on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users_profile (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant permissions on all tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON public.skills TO anon;

-- Grant permissions on sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
