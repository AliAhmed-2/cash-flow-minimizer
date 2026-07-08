import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeBalances, minimizeCashFlow } from "@/lib/minimizeCashFlow";

const GROUP_ID = "demo-group";

export async function GET() {
  const participants = await prisma.participant.findMany({ where: { groupId: GROUP_ID } });
  const debts = await prisma.debt.findMany({ where: { groupId: GROUP_ID } });

  const balances = computeBalances(
    participants.map((p) => p.id),
    debts
  );
  const transactions = minimizeCashFlow(balances);

  const settlement = await prisma.settlement.create({
    data: { groupId: GROUP_ID, result: JSON.stringify(transactions) },
  });

  return NextResponse.json({
    settlementId: settlement.id,
    transactions,
    rawDebtCount: debts.length,
  });
}
