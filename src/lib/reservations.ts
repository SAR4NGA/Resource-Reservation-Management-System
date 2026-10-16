import { prisma } from "@/lib/prisma";

export class ReservationConflictError extends Error {
  constructor(message = "This resource is already booked for part of that time window.") {
    super(message);
    this.name = "ReservationConflictError";
  }
}

/**
 * Pure overlap test, kept separate from the database query so it can be
 * unit tested directly without needing a running Postgres instance
 * (see reservations.test.ts).
 *
 * Two time ranges [aStart, aEnd) and [bStart, bEnd) overlap exactly when
 * aStart < bEnd AND bStart < aEnd. This is the standard interval-overlap
 * test and is what keeps the system from double-booking a resource.
 */
export function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export async function findConflictingReservation(
  resourceId: string,
  startTime: Date,
  endTime: Date,
  excludeReservationId?: string
) {
  return prisma.reservation.findFirst({
    where: {
      resourceId,
      status: "confirmed",
      id: excludeReservationId ? { not: excludeReservationId } : undefined,
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
  });
}

export async function createReservation(params: {
  resourceId: string;
  userId: string;
  team?: string;
  startTime: Date;
  endTime: Date;
}) {
  const { resourceId, userId, team, startTime, endTime } = params;

  if (startTime >= endTime) {
    throw new Error("Start time must be before end time.");
  }

  // Re-checked inside the transaction so two near-simultaneous bookings
  // for the same resource can't both slip through (basic race protection).
  return prisma.$transaction(async (tx) => {
    const conflict = await tx.reservation.findFirst({
      where: {
        resourceId,
        status: "confirmed",
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });

    if (conflict) {
      throw new ReservationConflictError();
    }

    return tx.reservation.create({
      data: {
        resourceId,
        userId,
        team: team || null,
        startTime,
        endTime,
      },
      include: { resource: true, user: true },
    });
  });
}
