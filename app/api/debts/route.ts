import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const GROUP_ID = "demo-group";

export async function GET() {
  const debts = await prisma.debt.findMany({
    where: { groupId: GROUP_ID },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(debts);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const fromId = body?.fromId;
  const toId = body?.toId;
  const amount = Number(body?.amount);

  if (!fromId || !toId || fromId === toId || !amount || amount <= 0) {
    return NextResponse.json(
      { error: "A valid from, to, and positive amount are required." },
      { status: 400 }
    );
  }

  const debt = await prisma.debt.create({
    data: { fromId, toId, amount: Math.round(amount * 100) / 100, groupId: GROUP_ID },
  });

  return NextResponse.json(debt, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const id = body?.id;

  if (!id) {
    return NextResponse.json({ error: "Debt id is required." }, { status: 400 });
  }

  await prisma.debt.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
