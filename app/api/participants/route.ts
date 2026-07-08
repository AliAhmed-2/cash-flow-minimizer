import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// No auth/login in this build, so every request shares one demo group.
const GROUP_ID = "demo-group";

export async function GET() {
  const participants = await prisma.participant.findMany({
    where: { groupId: GROUP_ID },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(participants);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const name = body?.name?.trim();

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const participant = await prisma.participant.create({
    data: { name, groupId: GROUP_ID },
  });

  return NextResponse.json(participant, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const id = body?.id;

  if (!id) {
    return NextResponse.json({ error: "Participant id is required." }, { status: 400 });
  }

  // Remove any debts involving this participant before deleting them.
  await prisma.debt.deleteMany({
    where: { OR: [{ fromId: id }, { toId: id }] },
  });
  await prisma.participant.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
