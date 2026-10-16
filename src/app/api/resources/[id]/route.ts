import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function adminOnly(session: Session | null) {
  if (!session)
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (session.user?.role !== "admin")
    return NextResponse.json(
      { error: "Only admins can modify resources." },
      { status: 403 }
    );
  return null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const denied = adminOnly(session);
  if (denied) return denied;

  const body = await req.json();
  const { name, type, capacity, location } = body;

  if (!name || !type) {
    return NextResponse.json(
      { error: "name and type are required." },
      { status: 400 }
    );
  }

  const resource = await prisma.resource.update({
    where: { id: params.id },
    data: {
      name,
      type,
      capacity: capacity ? Number(capacity) : null,
      location: location || null,
    },
  });

  return NextResponse.json(resource);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const denied = adminOnly(session);
  if (denied) return denied;

  // Prevent deleting a resource that still has confirmed reservations.
  const activeCount = await prisma.reservation.count({
    where: { resourceId: params.id, status: "confirmed" },
  });
  if (activeCount > 0) {
    return NextResponse.json(
      {
        error: `Cannot delete: this resource has ${activeCount} active reservation${activeCount > 1 ? "s" : ""}. Cancel them first.`,
      },
      { status: 409 }
    );
  }

  await prisma.resource.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
