import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const resources = await prisma.resource.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(resources);
}

// Resource creation is restricted to admins: anyone can browse what's
// available, but adding/removing what counts as a bookable resource is an
// administrative action, not something every member should be able to do.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json(
      { error: "Only admins can add resources." },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { name, type, capacity, location } = body;

  if (!name || !type) {
    return NextResponse.json(
      { error: "name and type are required." },
      { status: 400 }
    );
  }

  const resource = await prisma.resource.create({
    data: {
      name,
      type,
      capacity: capacity ? Number(capacity) : null,
      location: location || null,
    },
  });

  return NextResponse.json(resource, { status: 201 });
}
