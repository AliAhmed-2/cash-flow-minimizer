import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeBalances, minimizeCashFlow } from "@/lib/minimizeCashFlow";


export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
    const groupId =
    req.nextUrl.searchParams.get("groupId") ?? "demo-group";
  const participants = await prisma.participant.findMany({ where: { groupId} });
  const debts = await prisma.debt.findMany({ where: { groupId} });

  const balances = computeBalances(
    participants.map((p) => p.id),
    debts
  );
  const transactions = minimizeCashFlow(balances);

  const settlement = await prisma.settlement.create({
    data: { groupId, result: JSON.stringify(transactions) },
  });
  console.log("DATABASE_URL:", process.env.DATABASE_URL);
console.log("GROUP_ID:", groupId);

  return NextResponse.json({
    settlementId: settlement.id,
    transactions,
    rawDebtCount: debts.length,
  });
}
