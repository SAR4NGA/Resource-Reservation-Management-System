# Implementation notes

This doc is not part of the setup instructions (see `README.md` for that) — it's a
record of how the system is built and why, for explaining the implementation and
the decisions behind it.

## How I read the brief

The business scenario names three concrete pain points: scheduling confusion,
overlapping reservations, and uncertainty about availability. I treated those as
the actual spec, since the brief deliberately gives a scenario rather than a
technical spec. Everything in scope maps back to one of those three; everything
I left out (see "Out of scope" in the README) didn't.

## Architecture

- **Next.js App Router** for both the UI and the API, rather than a separate
  backend service. The brief calls for "full-stack JavaScript/TypeScript" with
  no mention of microservices or a separate API deployment, so a single Next.js
  app keeps the architecture as simple as the problem requires (see "Scope" in
  the assessment: "value thoughtful prioritization... over unnecessary
  complexity").
- **Explicit REST-style API routes** (`/api/resources`, `/api/reservations`)
  rather than Server Actions. I chose this so the application has a clear,
  inspectable API boundary — easier to reason about, test, and explain in a
  walkthrough than actions embedded in components.
- **Prisma** as the ORM, for type-safe queries against PostgreSQL and because
  its migration workflow (`prisma migrate dev`) gives a clean, reviewable
  history of the schema.
- **Server component for the overview page**, client components for the
  resources and reservations pages. The overview is read-only, so it's rendered
  server-side with a direct Prisma query — no API round-trip needed. The other
  two pages need interactive forms and optimistic re-fetching after
  create/cancel, so they're client components calling the API routes.

## The core design decision: preventing overlapping reservations

This is the one piece of engineering judgement the brief is explicitly testing
for ("Reservations are currently handled through informal communication...
resulting in... overlapping reservations").

**The check:** two time ranges `[aStart, aEnd)` and `[bStart, bEnd)` overlap
exactly when `aStart < bEnd AND bStart < aEnd`. This is the standard interval-
overlap test (see `findConflictingReservation` in `src/lib/reservations.ts`) and
covers every overlap case — partial overlap on either side, and one booking
fully containing another — with a single Prisma query.

**Where it runs:** the check happens twice. Once as a normal query so the API
can return a clear error, and a second time inside a Prisma `$transaction` right
before the `create` call. The second check matters because without it, two
people booking the same resource for the same slot at nearly the same moment
could both pass the first check before either has written their row — a classic
race condition. Running the check again inside the transaction, immediately
before the write, closes that window.

**What I didn't do:** a database-level exclusion constraint (PostgreSQL's
`EXCLUDE USING gist` with the `btree_gist` extension) would be the more
bulletproof version of this, enforced by the database itself rather than
application code. I chose the transaction-based check instead because it keeps
the schema plain Prisma-managed SQL with no extensions to install, which felt
like the right trade-off for the assessment's time box — but it's the first
thing I'd upgrade in a real production version of this system.

## Other decisions

- **`team` is a field on `Reservation`, not its own entity.** The scenario
  mentions resources being used by "different individuals and teams," but
  doesn't ask for team membership, permissions, or team-level reporting. Adding
  a full `Team` entity would mean building CRUD and membership management for a
  feature nobody asked for. A nullable text field captures the requirement
  without the unused complexity.
- **Cancelling sets `status = "cancelled"` rather than deleting the row.** The
  scenario says the organization wants to "maintain a clear understanding of
  their usage" — deleting history on cancel would work against that. Soft
  cancellation also means a cancelled slot correctly stops counting toward
  conflict checks (the overlap query filters on `status: "confirmed"`) while
  the record stays for reporting.
- **Users are found-or-created by email at booking time** rather than requiring
  a signup/login flow. The brief doesn't mention authentication, and building
  one would be scope creep; this still gives every reservation a real `User`
  record (so "who booked what" is always answerable) without the overhead of
  session management for an assessment-scale app.
- **No calendar UI.** A simple table of resources/reservations, ordered by
  time, with clear confirmed/cancelled states, answers "is this available"
  and "what's booked" just as well as a calendar view would at this scale, for
  a fraction of the build time. A calendar grid is the first UI upgrade I'd
  make with more time.

## Authentication: what was added, and where I drew the line

Authentication started out of scope — the brief doesn't mention it, and
building a full identity system is easy scope creep for an assessment with a
hard deadline. I added a minimal version anyway, because without it anyone
could cancel anyone else's reservation or add resources, which undercuts the
"reliable as the organization grows" requirement in the business scenario
more than I was comfortable with.

What's actually there:
- Email/password login via NextAuth (`next-auth`), JWT session strategy (no
  separate sessions table — keeps the schema and infra simpler).
- Two roles: `admin` and `member`, stored as a plain string on `User` (same
  field that already existed in the schema).
- A seed script (`prisma/seed.ts`) creates one default admin account, so
  there's always a known way in without building an invite system.
- Self-serve registration creates `member` accounts only — there's no UI
  path to become an admin, by design.
- Resource creation (`POST /api/resources`) requires `admin`.
- Cancelling a reservation (`PATCH /api/reservations/[id]`) requires being
  the reservation's own owner, or an admin.
- Route-level protection via Next.js middleware on the main pages; API
  routes additionally check the session server-side (defense in depth — the
  middleware alone wouldn't stop a direct API call).

What I deliberately left out, and why: password reset (needs email
delivery, which is itself out of scope), email verification (same reason),
OAuth/social login (adds provider config for no real benefit at this scale),
and any UI for promoting a member to admin (the seed script is the only way
to get an admin account — reasonable for an assessment, not for a real
product). Session security is also minimal by production standards: no
rate-limiting on login attempts, no account lockout. All of this is the kind
of thing I'd build out in a real deployment but would be unjustified
complexity here.

## Testing

Added unit tests (`src/lib/reservations.test.ts`, via Vitest) for the
interval-overlap function specifically, rather than trying to cover the
whole app. Reasoning: it's the single piece of logic where a subtle bug
would be worst — silently allowing a double-booking defeats the entire
point of the system — and it's pure (no database, no network), so it's cheap
to test thoroughly. Cases covered: simple overlap in both directions, one
range fully containing another, identical ranges, back-to-back adjacent
bookings correctly NOT overlapping (the half-open interval `[start, end)`
choice matters here), clearly separate ranges, and partial overlap.

I did not add integration tests against a real database, or component/UI
tests, given the time available — those would be the next layer to add.

## What I'd add with more time

- Database-level exclusion constraint as a second line of defense against
  overlap, as noted above.
- Password reset, email verification, and rate-limiting on login.
- Integration tests against a real (test) database, and basic UI tests.
- A calendar view per resource.
- Recurring reservations (explicitly out of scope per the README, but a
  natural next step).
