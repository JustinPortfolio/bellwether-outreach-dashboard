# Bellwether Outreach Dashboard

Tracking, monitoring, and human-approval dashboard for an AI-driven B2B outreach automation system built for **Bellwether Staffing Solutions**. The heavy lifting — company discovery, hiring-signal analysis, contact discovery, AI-personalized email drafting, and sequence enrollment — runs as a chain of n8n workflows; this app is the control surface: where a human reviews and approves every outbound email, monitors workflow health, and can halt the whole system instantly if something looks wrong.

## Why this exists

Fully autonomous outbound email at scale is a liability if it's wrong even a little: bad personalization, compliance violations, or a runaway sender can damage a company's reputation fast. This system is built around that constraint — **AI drafts, a human approves, and multiple independent safety gates exist to stop sending outright.**

## How it works

A chain of numbered n8n workflows does the work; this dashboard reads/writes the same Supabase database they use, so it's always showing live state, not a snapshot:

| Workflow | Purpose |
|---|---|
| 00 System Health Check | On-demand integration/health check across the pipeline |
| 01 Company Discovery | Finds candidate companies to evaluate |
| 02 Job Signal Analysis | Scores companies on hiring volume, specialty fit, and posting recency |
| 03 Contact Discovery | Finds and verifies a contact at qualified companies, adds the contactability score |
| 04 Personalization and Approval | Uses Claude to draft a personalized outreach email, validated against strict rules before it can queue for approval |
| 05 Apollo Sequence Enrollment | Enrolls approved contacts into an outreach sequence |
| 06-09 | Reply monitoring/classification, suppression handling, and ongoing health/error logging |

The dashboard surfaces:

- **Overview** live counts (qualified companies, pending approvals, active contacts, reply/meeting/bounce/unsubscribe rates) plus the current state of the safety switches
- **Approval queue** every AI-drafted email waits here for a human to approve, reject, edit, or request regeneration; nothing sends without this step
- **Workflow health** recent n8n run history and error log
- **Companies / Contacts / Replies / Meetings / Suppression** the underlying CRM-style views
- **Settings** the safety controls described below

## Safety mechanisms (built into the code, not just the UI)

- **Kill switch** a single flag halts every workflow that could create or advance outreach; monitoring/read-only workflows intentionally keep running so visibility isn't lost while paused (`lib/killSwitch.ts`)
- **Dry run mode** lets the whole pipeline execute without actually sending anything
- **AI output validation** the Claude-drafted email must pass word-count bounds, a minimum confidence score, and a forbidden-phrase/compliance check before it can leave "regenerate requested" status (`lib/aiOutputSchema.ts`)
- **Daily sending caps, idempotency keys, and dedup** prevent double-sends and runaway volume (`lib/dailyCaps.ts`, `lib/idempotency.ts`, `lib/dedup.ts`)
- **Suppression list and one-click unsubscribe tokens** bounces and unsubscribes are permanently excluded from future outreach (`lib/suppression.ts`, `lib/unsubscribeToken.ts`)
- **Transparent lead scoring** a documented, weighted 0-100 rubric (hiring volume, specialty alignment, recency, company fit, contactability) is the single source of truth shared between this codebase and the n8n scoring logic, kept in sync deliberately since n8n Code nodes can't import TypeScript modules directly (`lib/scoring.ts`)

## Tech stack

Next.js 14 (App Router) - TypeScript - Supabase (Postgres) - Tailwind CSS - Zod - Vitest

## Testing

Core business logic scoring, suppression, dedup, daily caps, idempotency, sequence eligibility, specialty matching, reply classification, AI output validation, the kill switch/dry-run interaction is covered by unit tests in `tests/`, run with:

```bash
npm run test
```

## Running locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local. The service-role key is required server-side only and is never exposed to the client see `lib/supabaseClient.ts`.

## Status

Actively used for a live outreach pipeline; the dashboard and safety layer are stable, with ongoing work on the analytics and settings views.

