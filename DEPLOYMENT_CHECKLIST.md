# Companion Passport — Deployment Checklist

Use this checklist before sharing the MVP with external testers (10–50 users).

## Vercel project setup

1. Push the repo to GitHub (or connect your Git provider)
2. Import the project at [vercel.com/new](https://vercel.com/new)
3. Framework preset: **Next.js**
4. Build command: `npm run build` (default)
5. Output directory: `.next` (default)
6. Deploy, then add a custom domain if desired

## Environment variables

Set these in **Vercel → Project → Settings → Environment Variables** (and in local `.env.local`):

### Supabase (required for cloud sync + analytics + feedback)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only — never expose to client)

### Admin
- `ADMIN_PASSWORD` (protects `/admin/waitlist` and `/admin/metrics`)

### AI providers (optional — mock mode works without)
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GEMINI_API_KEY`
- `OPENAI_COMPATIBLE_API_KEY` + `OPENAI_COMPATIBLE_BASE_URL` + `OPENAI_COMPATIBLE_MODEL`

Use `src/lib/env.ts` helpers to verify configuration. Warnings appear in Settings and Admin when Supabase is missing.

## Supabase setup

1. Create a Supabase project
2. Run migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_analytics_events.sql`
   - `supabase/migrations/003_feedback_improvements.sql`
3. Enable **Email** auth provider in Authentication → Providers
4. Configure email templates / confirmation if desired

### Supabase production URL setup

1. Authentication → URL Configuration
2. Set **Site URL** to your production domain (e.g. `https://your-app.vercel.app`)
3. Add redirect URLs:
   - `https://your-app.vercel.app/**`
   - `http://localhost:3000/**` (for local dev)
4. Re-test signup/login after changing URLs

## Pre-deploy tests

- [ ] `npm run build` succeeds
- [ ] App works **without** Supabase env vars (local demo mode)
- [ ] App works **without** AI env vars (Mock mode)
- [ ] Beta onboarding page at `/beta`
- [ ] Beta checklist appears after 18+ gate (dismissible)
- [ ] Signup at `/signup` creates account
- [ ] Login at `/login` loads cloud data
- [ ] Create companion → chat → memory approve → passport
- [ ] Mock AI mode works offline
- [ ] Real AI mode works with `OPENAI_API_KEY`
- [ ] AI fallback works when API key missing (mock reply + notice)
- [ ] Streaming chat works (OpenAI)
- [ ] Waitlist submission (logged in and logged out)
- [ ] Local → cloud migration prompt on login
- [ ] Export data from Settings
- [ ] Clear local data from Settings
- [ ] Delete cloud data from Settings (with confirmation)
- [ ] Admin waitlist at `/admin/waitlist` (password)
- [ ] Admin metrics at `/admin/metrics` (password + beta readiness summary)
- [ ] Feedback form with category + optional email
- [ ] Privacy page at `/privacy`
- [ ] Terms page at `/terms`
- [ ] 18+ age gate appears on first visit
- [ ] Beta disclaimer visible on landing + footer + settings
- [ ] Mobile layout readable on phone viewport

## Privacy verification

- [ ] Memory suggestions require explicit approval
- [ ] Analytics does **not** store raw chat or memory text
- [ ] Settings privacy copy mentions cloud sync + AI provider
- [ ] Delete cloud data message mentions analytics retention
- [ ] Privacy/Terms pages include “not legal advice” note

## Production domain

1. Deploy to Vercel
2. Set all environment variables for **Production** (and Preview if needed)
3. Add production URL to Supabase auth redirect URLs
4. Test signup/login on production URL
5. Share `/beta` as the tester entry point

## Post-deploy monitoring

1. Check `/admin/metrics` daily during beta — review **Beta readiness summary**
2. Review funnel: beta start → create → chat → memory approved → passport → waitlist
3. Review waitlist submissions at `/admin/waitlist`
4. Read feedback in Supabase `feedback` table (filter by `category`)

## Send to first 10 testers

1. Send invite with link to `/beta`
2. Ask them to: create companion, chat, approve a memory, view passport, send feedback
3. Remind: Mock mode = device-only; AI mode sends messages to provider
4. Collect feedback via footer form

## Known limitations

- Analytics only fire when Supabase is configured
- Admin metrics read last 90 days of events
- Single companion per cloud account
- Device settings (mock/AI provider) stay local per browser
- Env validation for server keys is visible only in admin API responses, not in browser
