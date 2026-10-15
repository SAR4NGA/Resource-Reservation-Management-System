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

- Browse available resources and their details (type, capacity, location)
- Create a reservation for a resource within a chosen time window
- Automatic conflict prevention — the system rejects a reservation that
  overlaps an existing one for the same resource
- View upcoming and past reservations
- Cancel an existing reservation
- Optional `team` label on a reservation, to reflect that resources are
  shared across both individuals and teams

### Out of scope

To keep the solution focused rather than over-engineered, the following were
deliberately excluded: payments/billing, email/SMS notifications, multi-step
approval workflows, multi-tenant/organization support, and recurring
reservations. These weren't required by the business scenario, and adding
them would have traded reliability and clarity for unnecessary complexity.

## Data model

Three entities: `User`, `Resource`, and `Reservation`. A reservation belongs
to one user and one resource, and carries its own time window and status
(e.g. confirmed/cancelled) so history is preserved rather than deleted on
cancellation. See the ER diagram (link below) for the full schema.

**ER diagram:** <!-- paste shareable link here -->

## Getting started

### Prerequisites

- Node.js 18+
- PostgreSQL running locally (or a connection string to a hosted instance)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/SAR4NGA/Resource-Reservation-Management-System.git
cd Resource-Reservation-Management-System

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# then edit .env and set DATABASE_URL to your PostgreSQL connection string

# 4. Run database migrations
npx prisma migrate dev

# 5. Start the development server
npm run dev
```

The app will be available at http://localhost:3000.

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

## Demo video

<!-- paste video link here -->

## Author

Pasindu Saranga (CheesCat)
GitHub: SAR4NGA
