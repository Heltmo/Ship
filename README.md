# TeamMatch MVP

TeamMatch is a dual-mode matching product:
- Cofounder matching (person to person) with mutual likes.
- Recruiting (person to project) with apply and accept.

Matching always creates a chat thread. Discovery is proof-gated, project listings require 7-14 day deliverables, and ranking favors reliability.

## Tech
- Next.js App Router + TypeScript + Tailwind + shadcn/ui
- Supabase (Postgres, Auth, RLS, Realtime)
- pgvector for embeddings

## Local setup
1. Create a Supabase project with Email auth enabled.
2. Copy `.env.example` to `.env.local` and fill in:
   - `SUPABASE_URL` / `SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (match your local URL)
3. Install dependencies and run the app:
   - `npm install`
   - `npm run dev`

## Notes
- This scaffold wires up auth, layout tabs, and a health check endpoint.
- Database schema, RLS policies, and domain logic are intentionally not implemented yet.

## Health check
Visit `/health` after signing in to see the current session payload.
