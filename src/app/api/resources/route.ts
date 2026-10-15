import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const resources = await prisma.resource.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(resources);
}

export async function POST(req: NextRequest) {
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
