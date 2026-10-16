import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createReservation, ReservationConflictError } from "@/lib/reservations";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const reservations = await prisma.reservation.findMany({
    orderBy: { startTime: "asc" },
    include: { resource: true, user: true },
  });
  return NextResponse.json(reservations);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json();
  const { resourceId, team, startTime, endTime } = body;

  if (!resourceId || !startTime || !endTime) {
    return NextResponse.json(
      { error: "resourceId, startTime and endTime are required." },
      { status: 400 }
    );
  }

  try {
    // The booking user comes from the session, not the request body, so
    // nobody can create a reservation under someone else's name.
    const reservation = await createReservation({
      resourceId,
      userId: session.user.id,
      team,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
    });
    return NextResponse.json(reservation, { status: 201 });
  } catch (err) {
    if (err instanceof ReservationConflictError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
