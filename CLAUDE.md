# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TeamMatch is a cofounder matching platform with proof-of-work gating. Users connect GitHub, import repositories as portfolio items, and discover other builders. Current MVP focuses on simple eligibility: GitHub connection + 2+ imported repos.

**Tech Stack**: Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui, Supabase (PostgreSQL, Auth, RLS)

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (localhost:3000)
npm run dev

# Build for production
npm build

# Lint code
npm run lint
```

## Environment Setup

Copy `.env.example` to `.env.local` and configure:
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` - Supabase project credentials
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Client-side Supabase credentials
- `NEXT_PUBLIC_SITE_URL` - App URL (e.g., http://localhost:3000)
- `APP_URL` - Used for OAuth redirects
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` - GitHub OAuth app credentials

## Architecture Patterns

### Server vs Client Components

**Server Components** (default): Use for data fetching, auth checks, and rendering static content. Access Supabase via `createServerSupabaseClient()`.

**Client Components** (`"use client"`): Only when you need interactivity, state, or browser APIs. Use Server Actions for mutations instead of client-side API calls.

### Data Flow Pattern

1. **Server Component** fetches data using `createServerSupabaseClient()`
2. **Server Actions** (`"use server"`) handle mutations and revalidate paths
3. **RPC Functions** in Postgres handle complex queries (e.g., `rpc_feed_people`, `rpc_like_user`)
4. **Database Triggers** auto-compute eligibility when user_identities or portfolio_items change

Example:
```typescript
// app/dashboard/people/page.tsx (Server Component)
export default async function PeoplePage() {
  const users = await getFeedPeople(); // Server Action
  return <UserList users={users} />;
}

// app/dashboard/people/actions.ts (Server Action)
"use server";
export async function getFeedPeople() {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase.rpc("rpc_feed_people", { p_limit: 50 });
  return { users: data || [] };
}
```

### Database Migrations

Located in `supabase/migrations/`. Apply migrations in Supabase SQL editor in order:

1. `20250101000000_initial_schema.sql` - Core tables
2. `20250102000000_eligibility_system.sql` - Eligibility function and triggers (legacy)
3. `20250103000001_github_integration_safe.sql` - GitHub OAuth support
4. `20250104000000_simplify_eligibility_github_only.sql` - **Current**: Simple eligibility (GitHub + 2 repos)

**Important**: Always use idempotent SQL (`IF NOT EXISTS`, `DROP IF EXISTS`, `CREATE OR REPLACE`) since migrations may be re-run.

### Eligibility System

Current logic (defined in `supabase/migrations/20250104000000_simplify_eligibility_github_only.sql`):

```sql
-- User is eligible if:
-- 1. Has GitHub connected (user_identities.provider = 'github')
-- 2. Has 2+ portfolio items (GitHub repos)

-- Auto-recomputed via database triggers:
-- - ON user_identities INSERT/UPDATE/DELETE
-- - ON portfolio_items INSERT/UPDATE/DELETE

-- Function: recompute_user_eligibility(p_user_id UUID)
-- Updates users_profile.is_eligible
```

**Client-side**: Use `getGatingStatus()` from `lib/validations/profile.ts` to check eligibility and display missing requirements.

### GitHub OAuth Flow

1. User clicks "Connect GitHub" → `/api/auth/github/start`
2. Redirects to GitHub with CSRF state token (stored in httpOnly cookie)
3. GitHub redirects to `/api/auth/github/callback` with code
4. Callback validates state, exchanges code for access token
5. Fetches GitHub user profile and saves to `user_identities` table
6. **Auto-syncs** profile: avatar, name, bio, location from GitHub (always overwrites)
7. Stores temporary access token in httpOnly cookie (10-minute TTL)
8. Redirects to `/dashboard/profile/connect-github` for repo selection
9. User selects repos → imported as `portfolio_items`
10. Trigger auto-computes eligibility

**Important**: GitHub profile data is ALWAYS synced (not "only if empty"). This is intentional design.

### Interactions System

Users can interact with other users via like/pass/save:

- **Pass**: Available to everyone (no eligibility check)
- **Like**: Gated by eligibility (GitHub + 2 repos)
- **Save**: Available to everyone

Implemented via `interactions` table with RPC functions:
- `rpc_like_user(p_target_user_id UUID)` - Returns `{ matched: boolean, thread_id: uuid }` if mutual like
- `rpc_pass_user(p_target_user_id UUID)` - Simple insert
- Direct insert for saves

### Validation with Zod

All Server Actions validate input using Zod schemas from `lib/validations/profile.ts`:

```typescript
import { profileBasicsSchema } from "@/lib/validations/profile";

export async function updateProfileBasics(data: ProfileBasicsInput) {
  const validationResult = profileBasicsSchema.safeParse(data);
  if (!validationResult.success) {
    return { error: "Validation failed", details: validationResult.error.flatten() };
  }
  // ... proceed with validated data
}
```

### Path Revalidation

After mutations, revalidate affected paths:

```typescript
import { revalidatePath } from "next/cache";

export async function updateProfile(data) {
  // ... update database
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/people/[userId]", "page");
  return { success: true };
}
```

## Key Database Tables

- `users_profile` - User profiles with eligibility flag
- `user_identities` - OAuth provider connections (GitHub, etc.)
- `portfolio_items` - Imported GitHub repos (proof of work)
- `user_skills` - User skills (legacy, not actively used in MVP)
- `interactions` - User interactions (like, pass, save)
- `matches` - Mutual likes create matches
- `threads` - Chat threads for matches
- `messages` - Thread messages

## Row Level Security (RLS)

All tables have RLS policies. Key patterns:

- Users can read their own data: `(SELECT auth.uid()) = user_id`
- Public profiles visible when eligible: `is_eligible = TRUE`
- Identity data: Users see only their own identities

## Common Gotchas

1. **Server vs Client Supabase**: Always use `createServerSupabaseClient()` in Server Components/Actions. Never import browser client in server code.

2. **Auth checks in Server Actions**: Always check `await supabase.auth.getUser()` before mutations.

3. **Type safety**: Supabase returns `any`. Cast to proper types defined in actions files.

4. **Migrations**: Use `CREATE OR REPLACE FUNCTION` and `DROP TRIGGER IF EXISTS` to allow re-running migrations.

5. **OAuth state**: GitHub OAuth uses CSRF protection via httpOnly cookies. Don't skip state validation.

6. **Temporary tokens**: GitHub access token stored in httpOnly cookie expires after 10 minutes. This is intentional - only for repo selection.

7. **Eligibility gating**: `rpc_like_user` checks eligibility server-side. UI also checks to show/hide Like button, but server is source of truth.

8. **Profile syncing**: GitHub OAuth callback ALWAYS syncs avatar, name, bio, location from GitHub (overwrites existing). This is intentional design.

## File Structure

```
app/
├── api/auth/github/          # GitHub OAuth routes
├── dashboard/
│   ├── people/               # User discovery feed
│   │   └── [userId]/         # Public profile view
│   ├── profile/              # Own profile editing
│   │   └── connect-github/   # GitHub repo selector
│   ├── inbox/                # Matches and messages
│   └── projects/             # Project listings (future)
lib/
├── supabase/
│   └── server.ts             # Server-side Supabase client
├── validations/
│   └── profile.ts            # Zod schemas and eligibility helpers
components/
├── ui/                       # shadcn/ui components
├── gating-status.tsx         # Eligibility status display
└── likes-locked-banner.tsx   # Eligibility gate banner
supabase/migrations/          # SQL migrations (apply in order)
```

## Current MVP State

**Working**:
- GitHub OAuth connection
- Profile auto-sync from GitHub
- Repository import as portfolio items
- Auto-eligibility computation (GitHub + 2 repos)
- People discovery feed (RPC-based)
- Like/pass/save interactions
- Mutual like → match + thread creation
- Public profile pages

**Future** (not implemented):
- Sophisticated matching (timezone, availability, work style, tools, stack)
- Project listings (recruiting mode)
- Realtime messaging
- Embeddings-based discovery (pgvector)
