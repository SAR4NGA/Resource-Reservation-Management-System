import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Cancelling updates status rather than deleting the row, so the
// organization keeps a usage history instead of losing the record.
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => ({}));
  const status = body.status === "cancelled" ? "cancelled" : "cancelled";

  const reservation = await prisma.reservation.update({
    where: { id: params.id },
    data: { status },
    include: { resource: true, user: true },
  });

  return NextResponse.json(reservation);
}
