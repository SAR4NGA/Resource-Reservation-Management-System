import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Cancelling updates status rather than deleting the row, so the
// organization keeps a usage history instead of losing the record.
// Only the reservation's own owner, or an admin, can cancel it.
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const existing = await prisma.reservation.findUnique({
    where: { id: params.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Reservation not found." }, { status: 404 });
  }
  if (existing.userId !== session.user.id && session.user.role !== "admin") {
    return NextResponse.json(
      { error: "You can only cancel your own reservations." },
      { status: 403 }
    );
  }

  const reservation = await prisma.reservation.update({
    where: { id: params.id },
    data: { status: "cancelled" },
    include: { resource: true, user: true },
  });

  return NextResponse.json(reservation);
}
