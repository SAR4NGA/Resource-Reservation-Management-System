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

## What I'd add with more time

- Database-level exclusion constraint as a second line of defense against
  overlap, as noted above.
- Authentication, so a reservation can only be cancelled by the person who
  made it (or an admin) rather than by anyone with the link.
- A calendar view per resource.
- Recurring reservations (explicitly out of scope per the README, but a
  natural next step).
