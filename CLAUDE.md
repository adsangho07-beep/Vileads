# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Vileads: a Next.js 14 (App Router) SaaS for B2B lead generation. Users search a business sector + city, the app scrapes Google Maps via an Apify actor, stores normalized leads in Supabase, and generates AI-written outreach messages (WhatsApp/email/SMS) per lead. UI and generated copy are French-first (error strings, prompts, labels), with an English mode for AI messages.

## Commands

```bash
npm run dev      # start dev server (localhost:3000)
npm run build    # production build
npm run start    # run production build
npm run lint     # next lint (eslint-config-next)
```

There is no test suite configured in this repo currently.

## Environment

Copy `.env.example` to `.env.local`. Required for full functionality:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `APIFY_TOKEN`
- One AI provider key: `GROQ_API_KEY`, `GEMINI_API_KEY`, or `OPENAI_API_KEY` (see provider selection below)

Supabase clients fall back to placeholder values when env vars are missing (see `lib/supabase/client.ts` and `server.ts`) so the app can statically build/prerender without real credentials — don't "fix" this by adding required-env assertions.

## Architecture

**Auth & routing**: `middleware.ts` gates all routes. It reads the Supabase session via `getUser()` (never `getSession()` server-side — noted in the code as insecure) and redirects unauthenticated users away from protected routes (`/dashboard`, `/searches`, `/leads`, `/analytics`, `/messages`, `/settings`) to `/login`, and authenticated users away from `/login`/`/signup` to `/dashboard`. Route groups: `app/(auth)/` for login/signup, `app/(dashboard)/` for the authenticated app shell (`app/(dashboard)/layout.tsx` wraps pages with `Sidebar`).

**Three Supabase client variants** (`lib/supabase/`), each for a distinct context — pick the right one rather than reusing across contexts:
- `client.ts` — browser client (`createBrowserClient`), for Client Components.
- `server.ts` — server client bound to Next's `cookies()`, for Server Components / Route Handlers acting as the logged-in user (respects RLS).
- `admin.ts` — service-role client, bypasses RLS. Used only for writes that happen outside the request's user session (e.g. updating a search's status from a background poll, upserting scraped leads).

**Search → scrape → leads pipeline** (async, polling-based, no webhooks):
1. `POST /api/searches` (`app/api/searches/route.ts`) inserts a `searches` row (`status: pending`) as the authenticated user, then calls `startGooglePlacesScrape` (`lib/apify/client.ts`) which starts the `compass/crawler-google-places` Apify actor. On success it flips the row to `running` and stores `apify_run_id`/`apify_dataset_id` using the admin client (this update isn't owned by the request's RLS-scoped session).
2. The UI polls `GET /api/searches/[id]/status` (`app/api/searches/[id]/status/route.ts`), which checks the Apify run status each call. On `SUCCEEDED` it fetches dataset items, normalizes them via `normalizeApifyPlace`, de-dupes by `place_id` within the batch, and `upsert`s into `leads` (`onConflict: 'search_id,place_id'`) using the admin client, then flips `searches.status` to `succeeded`. On terminal failure states (`FAILED`/`TIMED-OUT`/`ABORTED`) it marks the search `failed` with `error_message`.
3. There's a schema-level unique constraint `(search_id, place_id)` on `leads` backing the upsert dedup.

**AI message generation** (`app/api/leads/[id]/message/route.ts`): builds a channel/tone-specific prompt (`lib/prompts.ts::buildProspectionPrompt`), calls the configured AI provider, and **always falls back** to `generateFallbackProspectionMessage` (a hand-written template engine, same file) if the AI call throws or returns empty content — the request never fails purely because the AI provider is down. Every generation is persisted as a new row in `messages` (append-only history per lead, not an update-in-place).

**AI provider selection** (`lib/openai/client.ts`): uses the `openai` SDK against OpenAI-compatible endpoints. Provider is chosen by env var precedence — `GROQ_API_KEY` (via Groq's OpenAI-compatible endpoint, default model `llama-3.3-70b-versatile`) → `GEMINI_API_KEY` (via Gemini's OpenAI-compatible endpoint, default `gemini-1.5-flash`) → `OPENAI_API_KEY` (default `gpt-4o-mini`). `OPENAI_MODEL` overrides the model regardless of provider. Respect this precedence when touching AI call sites rather than hardcoding a provider.

**Data model** (`supabase/migrations/0001_init.sql`, mirrored in `types/db.ts`): `searches` → `leads` (FK `search_id`) → `messages` (FK `lead_id`), all also FK'd to `auth.users(id)` and RLS-scoped so a user only sees their own rows (`auth.uid() = user_id` on every policy). When adding a table or column, add a new numbered migration file rather than editing `0001_init.sql`, and update `types/db.ts` to match.

## Credit system (Moneroo)

Vileads is single-tenant merchant here (not BYOK) — there's one Moneroo secret key for the whole app, held in `MONEROO_SECRET_KEY`/`MONEROO_WEBHOOK_SECRET` env vars, read by `lib/moneroo/client.ts`. New signups get 5 free credits (via a Postgres trigger on `auth.users`, see `supabase/migrations/0002_credits.sql`); each lead search costs `LEAD_SEARCH_CREDIT_COST` (3, defined in `lib/credits.ts`). Credit packages are hardcoded in `CREDIT_PACKAGES` (`lib/credits.ts`) — edit that array to change pricing/tiers.

**Ledger model**: `user_credits` holds the current balance per user; `credit_transactions` is an append-only audit log (`signup_bonus` | `purchase` | `consumption` | `refund`). All balance mutations go through two SECURITY DEFINER Postgres functions rather than direct table writes, so the balance update and the ledger row are atomic:
- `consume_credits(p_amount, p_reference_type, p_reference_id, p_description)` — operates on `auth.uid()` only (never a caller-supplied user id), so it's safe to expose to the `authenticated` role. Raises `INSUFFICIENT_CREDITS` if the balance is too low; callers must match on that substring in the RPC error message (see `app/api/searches/route.ts`), not on an error code.
- `add_credits(p_user_id, p_amount, p_type, ...)` — takes an arbitrary user id, so it's revoked from `anon`/`authenticated` in the migration and granted only to `service_role`. Only call this via `lib/supabase/admin.ts`'s client (webhook handler, Apify-failure refund path). Granting it to `authenticated` would let any signed-in user credit their own (or anyone's) balance directly via the PostgREST RPC endpoint.

**Search flow**: `POST /api/searches` inserts the `searches` row first, then calls `consume_credits` referencing that row's id; on `INSUFFICIENT_CREDITS` it deletes the just-inserted row and returns `402` with `code: 'INSUFFICIENT_CREDITS'` (the frontend, `components/SearchForm.tsx`, keys off that to show a "buy credits" CTA). If the Apify start call then fails, the credits are refunded via `add_credits` with `type: 'refund'` — a search should never permanently cost credits if the scrape never started.

**Purchase flow**: `POST /api/credits/checkout` inserts a `credit_purchases` row (`status: pending`) before calling Moneroo, exactly like the `searches` → Apify pattern — the webhook can arrive before the HTTP response. `app/api/webhooks/moneroo/route.ts` verifies `X-Moneroo-Signature` (HMAC-SHA256 over the raw body — must use `request.text()`, never `request.json()`, or the signature will never match), dedupes via `processed_webhook_events` (distinguishing a real unique-constraint violation, code `23505`, from other insert failures — the latter should surface as a 500 so Moneroo retries rather than silently losing the event), re-queries Moneroo's `/verify` endpoint before granting credits (defense-in-depth against a leaked webhook secret), checks the reported amount/currency against the `credit_purchases` row, and only then calls `add_credits`. The `credit_purchases.status` transition is itself guarded by `.eq('status', 'pending')` so a replayed webhook is a no-op.

Reference material for this integration style (BYOK multi-provider payments — Stripe/Moneroo/Bictorys/PayTech) lives in `izisaas mobile money skills/` at the repo root; it's an untracked skill bundle, not part of the app, and is excluded from `tsconfig.json` so its example files (which reference packages like `zod` that aren't installed) don't break `next build`.

## Security note

`.agents/mcp_config.json` is committed to this repo and contains a live-looking Supabase access token and project ref for the `@supabase/mcp-server-supabase` MCP server. Treat this as a leaked secret — flag it to the user (rotate the token / move it to an untracked local config) rather than propagating or referencing it further.
