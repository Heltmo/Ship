# TeamMatch Database Migration Guide

This guide explains how to apply the database migrations to your Supabase project.

## Overview

The migration file creates:
- **17 tables** for users, projects, matching, messaging, sprints, and reputation
- **pgvector extension** for semantic search
- **Optimized indexes** for feed queries and vector similarity search
- **Row Level Security (RLS) policies** for all tables
- **Triggers** for auto-updating timestamps and creating user profiles

## How to Apply the Migration

### Option 1: Using Supabase Dashboard (Recommended for first-time setup)

1. **Open your Supabase project dashboard**
   - Go to https://app.supabase.com
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar

3. **Create a new query**
   - Click "New Query"

4. **Copy and paste the migration**
   - Open `supabase/migrations/20250101000000_initial_schema.sql`
   - Copy the entire contents
   - Paste into the SQL Editor

5. **Run the migration**
   - Click "Run" or press Ctrl+Enter (Cmd+Enter on Mac)
   - Wait for completion (should take 5-10 seconds)

6. **Verify success**
   - Navigate to "Table Editor" in the sidebar
   - You should see all 17 tables listed

### Option 2: Using Supabase CLI (Recommended for version control)

1. **Install Supabase CLI** (if not already installed)
   ```bash
   npm install -g supabase
   ```

2. **Initialize Supabase in your project** (if not already done)
   ```bash
   supabase init
   ```

3. **Link to your remote project**
   ```bash
   supabase link --project-ref your-project-ref
   ```
   - Find your project ref in the Supabase dashboard URL or project settings

4. **Push the migration to Supabase**
   ```bash
   supabase db push
   ```
   - This will apply all migrations in the `supabase/migrations` folder

5. **Verify migration status**
   ```bash
   supabase migration list
   ```

### Option 3: Local Development with Supabase

1. **Start local Supabase** (requires Docker)
   ```bash
   supabase start
   ```

2. **The migration will be automatically applied**
   - Local Supabase applies all migrations in `supabase/migrations` on startup

3. **Access local Studio**
   - Open http://localhost:54323
   - View your tables and data

## What Gets Created

### Core Tables
- `users_profile` - Extended user profiles
- `skills` - Master skills list
- `user_skills` - User-skill relationships
- `portfolio_items` - Proof of work

### Project Tables
- `projects` - Project listings
- `project_roles_needed` - Open positions

### Matching Tables
- `interactions` - User actions (like, pass, apply)
- `matches` - Matched relationships

### Messaging Tables
- `threads` - Conversation threads
- `thread_participants` - Thread membership
- `messages` - Chat messages

### Work Tracking Tables
- `sprints` - 7-14 day work cycles
- `sprint_checkins` - Progress updates
- `sprint_artifacts` - Deliverables

### Reputation Tables
- `reputation_signals` - User reliability metrics

### AI/Search Tables
- `user_embeddings` - Vector embeddings for users
- `project_embeddings` - Vector embeddings for projects

## Important Notes

### RLS Policies
- All tables have RLS enabled
- Policies enforce secure access patterns:
  - Users can only modify their own data
  - Public profiles are viewable by everyone
  - Private profiles only viewable by owner
  - Thread messages only visible to participants

### Auto-Generated Features
- User profiles are **automatically created** when users sign up (via trigger on `auth.users`)
- `updated_at` timestamps are **automatically updated** on record changes
- Thread `last_message_at` is **automatically updated** when messages are sent

### Vector Search (pgvector)
- Embeddings use 1536 dimensions (OpenAI ada-002 format)
- HNSW indexes for fast approximate nearest neighbor search
- Adjust dimension size if using different embedding models

### Service Role Access
- Some tables (embeddings, reputation) have permissive policies
- In production, restrict these to service role only
- Use Supabase service role key for background jobs

## Next Steps

After applying the migration:

1. **Seed initial data** (optional)
   - Add common skills to the `skills` table
   - Consider using `supabase/seed.sql` for this

2. **Test RLS policies**
   - Create test users
   - Verify data access controls work correctly

3. **Set up background jobs** (for production)
   - Embedding generation when profiles/projects are created
   - Reputation score calculations
   - Match notifications

4. **Configure Storage** (if needed)
   - For avatar images, portfolio images, sprint artifacts
   - Set up Supabase Storage buckets with appropriate policies

## Troubleshooting

### Error: "extension vector does not exist"
- pgvector may not be enabled on your Supabase plan
- Go to Database > Extensions in dashboard and enable "vector"

### Error: "permission denied"
- Make sure you're using the service role key for CLI operations
- Or run migration through the Supabase dashboard as project owner

### Migration already applied
- Check `supabase_migrations` table to see applied migrations
- If re-running, drop tables first (⚠️ destroys data)

## Rolling Back

To roll back this migration:

```sql
-- Drop all tables (WARNING: Destroys all data)
DROP TABLE IF EXISTS public.project_embeddings CASCADE;
DROP TABLE IF EXISTS public.user_embeddings CASCADE;
DROP TABLE IF EXISTS public.reputation_signals CASCADE;
DROP TABLE IF EXISTS public.sprint_artifacts CASCADE;
DROP TABLE IF EXISTS public.sprint_checkins CASCADE;
DROP TABLE IF EXISTS public.sprints CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.thread_participants CASCADE;
DROP TABLE IF EXISTS public.threads CASCADE;
DROP TABLE IF EXISTS public.matches CASCADE;
DROP TABLE IF EXISTS public.interactions CASCADE;
DROP TABLE IF EXISTS public.project_roles_needed CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.portfolio_items CASCADE;
DROP TABLE IF EXISTS public.user_skills CASCADE;
DROP TABLE IF EXISTS public.skills CASCADE;
DROP TABLE IF EXISTS public.users_profile CASCADE;
```
