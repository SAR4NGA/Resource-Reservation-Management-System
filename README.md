# Resource Reservation Management System

A full-stack web application that lets an organization manage shared resources
(rooms, equipment, vehicles, etc.) and coordinate reservations for them,
replacing informal, manual scheduling with a centralized system.

Built for the PrimeWave Lab Software Engineering Internship technical assessment.

## Problem

The organization manages several shared resources used by different individuals
and teams. Reservations are currently handled informally, leading to scheduling
confusion, overlapping bookings, and uncertainty about availability. This app
centralizes resource management and reservation coordination, and actively
prevents double-bookings.

## Tech stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma (see prisma/schema.prisma)
- **Version control:** Git / GitHub

## Features

- Email/password authentication with two roles: **admin** and **member**
- Browse available resources and their details (type, capacity, location)
- Create a reservation for a resource within a chosen time window
- Automatic conflict prevention — the system rejects a reservation that
  overlaps an existing one for the same resource
- View upcoming and past reservations
- Cancel a reservation (your own, or any reservation if you're an admin)
- Only admins can add new resources
- Optional `team` label on a reservation, to reflect that resources are
  shared across both individuals and teams

### Out of scope

To keep the solution focused rather than over-engineered, the following were
deliberately excluded: payments/billing, email/SMS notifications, multi-step
approval workflows, multi-tenant/organization support, recurring
reservations, OAuth/social login, password reset, and email verification.
These weren't required by the business scenario, and adding them would have
traded reliability and clarity for unnecessary complexity. Authentication
itself was initially considered out of scope for the same reason, but was
added as it meaningfully improves the real-world correctness of the
cancel/create flows (see `IMPLEMENTATION_NOTES.md`) — kept intentionally
minimal (credentials only, no password reset/verification) to match the
assessment's scope.

## Data model

Three entities: `User`, `Resource`, and `Reservation`. A reservation belongs
to one user and one resource, and carries its own time window and status
(e.g. confirmed/cancelled) so history is preserved rather than deleted on
cancellation. See the ER diagram (link below) for the full schema.


## Getting started

### Prerequisites

- Node.js 18+
- PostgreSQL running locally (or a connection string to a hosted instance)

### Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd <repo-folder>

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# then edit .env:
#   - DATABASE_URL: your PostgreSQL connection string
#   - NEXTAUTH_SECRET: any random string (e.g. output of `openssl rand -base64 32`)
#   - NEXTAUTH_URL: http://localhost:3000 for local dev

# 4. Run database migrations
npx prisma migrate dev

# 5. Seed a default admin account
npm run seed
# creates admin@primewave.local / admin123 — log in with this, then use the
# Register page to create additional member accounts

# 6. Start the development server
npm run dev
```

The app will be available at http://localhost:3000. You'll be redirected to
`/login` until you sign in.

### Running tests

```bash
npm test
```

Covers the overlap-detection logic in `src/lib/reservations.ts` — the core
piece of business logic the conflict prevention relies on.

## Key design decisions

- **Overlap prevention:** reservations are validated server-side against
  existing bookings for the same resource before being persisted, so a
  conflicting time window is rejected rather than silently allowed.
- **Soft cancellation:** cancelling a reservation updates its `status` rather
  than deleting the row, preserving a usage history as the scenario implies
  the organization needs ("maintain a clear understanding of their usage").
- **Team as a field, not an entity:** since the brief didn't require team
  management (membership, permissions, etc.), a lightweight `team` text field
  on `Reservation` covers the "individuals and teams" requirement without
  adding an unused layer of complexity.
- **Minimal authentication, not a full identity system:** email/password via
  NextAuth with JWT sessions, two roles (admin/member), and a seeded default
  admin account. No OAuth, password reset, or email verification — those add
  real complexity without changing whether the app correctly prevents
  double-bookings and protects who can cancel what, which is what the
  assessment is actually evaluating.

## Demo video

(https://drive.google.com/file/d/1Xa4qPDczpjfxId0TFw0Vyr20R4QR0nTV/view?usp=drive_link)

**ER diagram:** 
https://github.com/SAR4NGA/Resource-Reservation-Management-System/tree/main/diagrams

## Author

Pasindu Saranga
GitHub: SAR4NGA
