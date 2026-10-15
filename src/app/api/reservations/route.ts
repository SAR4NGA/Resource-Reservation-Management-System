import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createReservation, ReservationConflictError } from "@/lib/reservations";

export async function GET() {
  const reservations = await prisma.reservation.findMany({
    orderBy: { startTime: "asc" },
    include: { resource: true, user: true },
  });
  return NextResponse.json(reservations);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { resourceId, userName, userEmail, team, startTime, endTime } = body;

  if (!resourceId || !userName || !userEmail || !startTime || !endTime) {
    return NextResponse.json(
      { error: "resourceId, userName, userEmail, startTime and endTime are required." },
      { status: 400 }
    );
  }

  try {
    const reservation = await createReservation({
      resourceId,
      userName,
      userEmail,
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
