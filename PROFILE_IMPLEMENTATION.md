# Profile Creation/Edit Implementation

This document describes the profile system with discovery gating that has been implemented for TeamMatch.

## Overview

Users must complete their profile to specific requirements before appearing in the discovery feed. This "proof-gated" approach ensures only serious, qualified users are visible to others.

## Gating Requirements

To appear in the People discovery feed, a user profile must have:

1. ✅ **Role Intent** - What they're looking for (cofounder/projects/both)
2. ✅ **Timezone** - Selected from common timezones
3. ✅ **Availability** - Hours per week (1-168)
4. ✅ **At least 5 skills** - Demonstrated expertise areas
5. ✅ **At least 2 portfolio items** - Proof of work (links required)

## Files Created/Modified

### Database Schema
- **[supabase/migrations/20250101000000_initial_schema.sql](supabase/migrations/20250101000000_initial_schema.sql)**
  - Added `role_intent` field to `users_profile` table
  - Existing tables: `users_profile`, `user_skills`, `portfolio_items`, `skills`

### Validation Layer
- **[lib/validations/profile.ts](lib/validations/profile.ts)** (NEW)
  - Zod schemas for profile basics, skills, and portfolio items
  - `isProfileEligibleForDiscovery()` - Check if user meets requirements
  - `getGatingStatus()` - Returns eligibility status and missing requirements

### Server Actions
- **[app/dashboard/profile/actions.ts](app/dashboard/profile/actions.ts)** (NEW)
  - `getProfile()` - Fetch user profile with skills, portfolio, and gating status
  - `updateProfileBasics()` - Update basic profile information
  - `updateUserSkills()` - Add/update user skills (min 5 required)
  - `updatePortfolioItems()` - Add/update portfolio items (min 2 required)
  - `deletePortfolioItem()` - Remove portfolio item
  - `getAllSkills()` - Fetch available skills from database
  - `createSkill()` - Add new skill to master list

### UI Components
- **[components/gating-status.tsx](components/gating-status.tsx)** (NEW)
  - Visual indicator showing if profile is eligible for discovery
  - Lists missing requirements if not eligible
  - Green badge for "Eligible" / Amber badge for "Locked"

- **[components/ui/select.tsx](components/ui/select.tsx)** (NEW)
  - Radix UI select component for dropdowns

- **[app/dashboard/profile/profile-form.tsx](app/dashboard/profile/profile-form.tsx)** (NEW)
  - Three-section form:
    - **Basics** - Name, role intent, timezone, availability, bio, social links
    - **Skills** - Comma-separated skill input (minimum 5)
    - **Portfolio** - Multiple portfolio items with title, URL, description, type
  - Real-time validation with Zod
  - Success/error feedback
  - Independent save buttons for each section

### Pages
- **[app/dashboard/profile/page.tsx](app/dashboard/profile/page.tsx)** (UPDATED)
  - Displays gating status card at top
  - Renders profile form
  - Server-side data fetching

- **[app/dashboard/people/page.tsx](app/dashboard/people/page.tsx)** (UPDATED)
  - Queries only eligible users (those who meet all 5 requirements)
  - Displays user cards with profile info
  - Shows skill count, portfolio count, availability
  - Like/Pass action buttons (UI only, not yet functional)

### Seed Data
- **[supabase/seed.sql](supabase/seed.sql)** (NEW)
  - 95+ common skills across categories:
    - Programming languages (JavaScript, Python, Go, etc.)
    - Frontend (React, Vue, Next.js, etc.)
    - Backend (Node.js, Django, FastAPI, etc.)
    - Mobile (React Native, Flutter, iOS, Android)
    - Databases (PostgreSQL, MongoDB, Redis, etc.)
    - DevOps (Docker, Kubernetes, AWS, etc.)
    - Design (Figma, UI/UX, Photoshop, etc.)
    - Data & AI (Machine Learning, TensorFlow, etc.)
    - Marketing & Product

## How It Works

### 1. Profile Completion Flow

```
User signs up
    ↓
Auto-created profile (via trigger on auth.users)
    ↓
User navigates to /dashboard/profile
    ↓
Sees "Discovery Locked" status with missing requirements
    ↓
Fills in Basics section (role_intent, timezone, availability, etc.)
    ↓
Adds 5+ skills (comma-separated)
    ↓
Adds 2+ portfolio items with URLs
    ↓
Status changes to "Eligible" ✅
    ↓
User now appears in /dashboard/people feed for others
```

### 2. Discovery Feed Logic

The People page (`/dashboard/people`) queries for users where:
- `profile_visibility = 'public'`
- `role_intent IS NOT NULL`
- `timezone IS NOT NULL`
- `availability_hours_per_week >= 1`
- Skill count >= 5 (checked via count query)
- Portfolio count >= 2 (checked via count query)

Only users meeting ALL criteria are shown.

### 3. Form Sections

**Basics Section:**
- Full Name (required)
- Role Intent (required, dropdown: cofounder/projects/both)
- Headline (optional, min 10 chars)
- Bio (optional, max 1000 chars)
- Timezone (required, dropdown of common timezones)
- Availability hours/week (required, 1-168)
- Location (optional)
- Social links (LinkedIn, GitHub, Twitter, Website)

**Skills Section:**
- Comma-separated text input
- Minimum 5 skills required
- Real-time count display
- Note: Currently uses simple text input; could be enhanced with autocomplete

**Portfolio Section:**
- Dynamic form (add/remove items)
- Minimum 2 items required
- Each item has:
  - Title (required)
  - URL (required, validated)
  - Description (optional)
  - Project type (dropdown: web_app, mobile_app, open_source, design, other)

## Dependencies Installed

```json
{
  "zod": "^3.x",
  "@radix-ui/react-select": "^2.x",
  "lucide-react": "^0.x"
}
```

## Database Setup

### 1. Apply Migration

```bash
# Using Supabase Dashboard
# - Open SQL Editor
# - Copy contents of supabase/migrations/20250101000000_initial_schema.sql
# - Run query

# OR using Supabase CLI
supabase db push
```

### 2. Seed Skills Data

```bash
# In Supabase Dashboard SQL Editor
# - Copy contents of supabase/seed.sql
# - Run query
```

This adds 95+ common skills to the `skills` table.

## Validation Rules

### Profile Basics (Zod Schema)
```typescript
{
  full_name: string (required, max 100),
  headline: string (min 10, max 200, optional),
  bio: string (max 1000, optional),
  location: string (max 100, optional),
  timezone: string (required),
  role_intent: enum["looking_for_cofounder", "looking_for_projects", "both"] (required),
  availability_hours_per_week: number (1-168, required),
  linkedin_url: url (optional),
  github_url: url (optional),
  twitter_url: url (optional),
  website_url: url (optional)
}
```

### Skills (Zod Schema)
```typescript
{
  skills: array of skill objects, min 5 items
  each skill: {
    skill_id: uuid (required),
    proficiency_level: enum["beginner", "intermediate", "advanced", "expert"] (optional),
    years_of_experience: number (0-50, optional)
  }
}
```

### Portfolio (Zod Schema)
```typescript
{
  portfolio: array of portfolio items, min 2 items
  each item: {
    title: string (required, max 200),
    description: string (max 1000, optional),
    url: url (required),
    project_type: enum["web_app", "mobile_app", "open_source", "design", "other"] (optional),
    tags: array of strings (optional),
    is_featured: boolean (default false)
  }
}
```

## UI/UX Features

### Gating Status Card
- **Eligible**: Green card with checkmark badge
- **Locked**: Amber card with X badge and list of missing requirements
- Dynamically updates based on profile completion

### Form Behavior
- Each section saves independently
- Real-time validation feedback
- Success messages (auto-dismiss after 3s)
- Error messages (persist until resolved)
- Loading states on submit buttons
- Form fields pre-populated with existing data

### People Feed
- Grid layout (2 columns on desktop)
- User cards show:
  - Name, headline, bio (truncated)
  - Role intent badge
  - Location, timezone, availability
  - Skill count and portfolio count badges
  - Like/Pass buttons (placeholder)
  - "View Links" button if social links exist
- Empty state when no eligible users
- Hover effect on cards

## Security (RLS Policies)

All data access is secured via Row Level Security:

- **users_profile**: Users can only update their own profile
- **user_skills**: Users can only manage their own skills
- **portfolio_items**: Users can only manage their own portfolio items
- **Public profiles**: Viewable by all authenticated users if `profile_visibility = 'public'`
- **Private profiles**: Only viewable by owner

## Next Steps (Not Implemented)

To complete the profile/discovery system, you would need to:

1. **Skills Autocomplete**
   - Replace textarea with autocomplete/multi-select
   - Search existing skills as user types
   - Allow creating new skills on-the-fly

2. **Portfolio Image Uploads**
   - Set up Supabase Storage buckets
   - Add image upload for portfolio items
   - Display images in portfolio cards

3. **Avatar Upload**
   - Add avatar upload to profile basics
   - Display avatars in People feed cards

4. **Like/Pass Actions**
   - Implement server actions for interactions
   - Store in `interactions` table
   - Create matches when mutual likes occur

5. **Profile Detail Modal**
   - Click user card to see full profile
   - Show all portfolio items
   - Display all skills with proficiency levels
   - Show social links

6. **Filters & Search**
   - Filter People feed by role_intent, skills, location
   - Search by name or keywords
   - Sort by reliability score (once calculated)

7. **Profile Completeness Indicator**
   - Progress bar showing % complete
   - Step-by-step onboarding wizard for new users

8. **Email Notifications**
   - Notify when profile becomes eligible
   - Remind users to complete profile

## Testing Checklist

- [ ] Apply database migration
- [ ] Seed skills data
- [ ] Create test user account
- [ ] Navigate to /dashboard/profile
- [ ] Verify "Discovery Locked" status shows
- [ ] Fill in basics section and save
- [ ] Add 5 skills and save
- [ ] Add 2 portfolio items and save
- [ ] Verify status changes to "Eligible"
- [ ] Navigate to /dashboard/people
- [ ] Create second test user with complete profile
- [ ] Verify second user appears in first user's People feed
- [ ] Verify incomplete profiles don't appear

## Known Limitations

1. **Skills Input**: Currently a simple textarea (comma-separated). Should be autocomplete.
2. **No Image Uploads**: Portfolio and avatar images not yet supported.
3. **Like/Pass Buttons**: UI only, no backend logic yet.
4. **No Pagination**: People feed loads all eligible users (fine for MVP, needs pagination at scale).
5. **Skill Validation**: Skills are validated by ID but the form uses text input (mismatch).

## File Summary

```
Created/Modified: 12 files
- 1 database migration (updated)
- 1 seed data file (new)
- 2 validation files (new)
- 2 server action files (new/updated)
- 4 UI components (new)
- 2 page files (updated)
```

Total lines of code: ~1,400 lines
