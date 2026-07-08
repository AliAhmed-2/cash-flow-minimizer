import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const GROUP_ID = "demo-group";

export async function GET() {
  const settlement = await prisma.settlement.findFirst({
    where: { groupId: GROUP_ID },
    orderBy: { createdAt: "desc" },
  });

  if (!settlement) {
    return NextResponse.json({ error: "No settlement has been run yet." }, { status: 404 });
  }

  const participants = await prisma.participant.findMany({ where: { groupId: GROUP_ID } });
  const debts = await prisma.debt.findMany({ where: { groupId: GROUP_ID } });
  const transactions = JSON.parse(settlement.result) as { from: string; to: string; amount: number }[];

  const nameOf = (id: string) => participants.find((p) => p.id === id)?.name ?? "Unknown";

  const lines: string[] = [];
  lines.push("CASH FLOW MINIMIZER — SETTLEMENT REPORT");
  lines.push(`Generated: ${settlement.createdAt.toLocaleString()}`);
  lines.push("");
  lines.push(`PARTICIPANTS (${participants.length})`);
  participants.forEach((p) => lines.push(`  - ${p.name}`));
  lines.push("");
  lines.push(`RAW DEBTS LOGGED (${debts.length})`);
  debts.forEach((d) => lines.push(`  - ${nameOf(d.fromId)} owes ${nameOf(d.toId)}: $${d.amount.toFixed(2)}`));
  lines.push("");
  lines.push(`MINIMUM SETTLEMENT (${transactions.length} transaction(s))`);
  if (transactions.length === 0) lines.push("  - Everyone is already settled up.");
  transactions.forEach((t) => lines.push(`  - ${nameOf(t.from)} pays ${nameOf(t.to)}: $${t.amount.toFixed(2)}`));
  lines.push("");
  const saved = debts.length - transactions.length;
  lines.push(
    `SUMMARY: reduced ${debts.length} raw debt(s) to ${transactions.length} transaction(s)` +
      (saved > 0 ? ` — ${saved} fewer payment(s).` : ".")
  );

  return new NextResponse(lines.join("\n"), {
    headers: { "Content-Type": "text/plain" },
  });
}
