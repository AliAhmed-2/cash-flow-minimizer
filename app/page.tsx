"use client";

import { useEffect, useState } from "react";
import GraphView from "@/components/GraphView";

type Participant = { id: string; name: string };
type Debt = { id: string; fromId: string; toId: string; amount: number };
type Transaction = { from: string; to: string; amount: number };

const STEPS = ["Participants", "Debts", "Optimize", "Report"];

const inputClass =
  "flex-1 min-w-[120px] bg-panel2 border border-line text-ink text-sm px-3 py-2 rounded-md outline-none";
const btnClass =
  "bg-goldbg border border-goldline text-gold text-sm font-semibold px-4 py-2 rounded-md whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed";
const ghostBtnClass =
  "bg-transparent border border-line text-inkmuted text-sm font-semibold px-4 py-2 rounded-md";

export default function Home() {
  const [step, setStep] = useState(1);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [nameInput, setNameInput] = useState("");
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [amount, setAmount] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadParticipants = () =>
    fetch("/api/participants").then((r) => r.json()).then(setParticipants);
  const loadDebts = () => fetch("/api/debts").then((r) => r.json()).then(setDebts);

  useEffect(() => {
    loadParticipants();
    loadDebts();
  }, []);

  async function addParticipant() {
    const name = nameInput.trim();
    if (!name) return;
    setError("");
    const res = await fetch("/api/participants", { method: "POST", body: JSON.stringify({ name }) });
    if (!res.ok) return setError((await res.json()).error ?? "Could not add participant.");
    setNameInput("");
    loadParticipants();
  }

  async function removeParticipant(id: string) {
    await fetch("/api/participants", { method: "DELETE", body: JSON.stringify({ id }) });
    loadParticipants();
    loadDebts();
  }

  async function addDebt() {
    const amt = parseFloat(amount);
    if (!fromId || !toId || fromId === toId || !amt || amt <= 0) {
      return setError("Pick two different people and a positive amount.");
    }
    setError("");
    const res = await fetch("/api/debts", { method: "POST", body: JSON.stringify({ fromId, toId, amount: amt }) });
    if (!res.ok) return setError((await res.json()).error ?? "Could not add debt.");
    setAmount("");
    loadDebts();
  }

  async function removeDebt(id: string) {
    await fetch("/api/debts", { method: "DELETE", body: JSON.stringify({ id }) });
    loadDebts();
  }

  async function runOptimizer() {
    setLoading(true);
    const res = await fetch("/api/settle");
    const data = await res.json();
    setTransactions(data.transactions);
    setLoading(false);
    setStep(3);
  }

  async function loadReport() {
    const res = await fetch("/api/report");
    setReport(await res.text());
    setStep(4);
  }

  function downloadReport() {
    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "settlement-report.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  const nameOf = (id: string) => participants.find((p) => p.id === id)?.name ?? "?";
  const gross = debts.reduce((s, d) => s + d.amount, 0);

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 pb-16">
      <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-gold mb-2">Settlement ledger</p>
      <h1 className="font-serif text-3xl mb-1.5">Cash flow minimizer</h1>
      <p className="text-inkmuted max-w-lg leading-relaxed mb-7 text-sm">
        Add a group, log who owes whom, then let the greedy settlement engine collapse it down to the
        smallest possible set of payments.
      </p>

      {/* metrics */}
      <div className="grid grid-cols-3 border border-line rounded-lg overflow-hidden mb-7">
        <Metric label="Participants" value={participants.length} />
        <Metric label="Debts logged" value={debts.length} />
        <Metric label="Gross owed" value={`$${gross.toFixed(2)}`} last />
      </div>

      {/* stepper */}
      <div className="flex border-b border-line mb-6">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const disabled =
            (n === 2 && participants.length < 2) ||
            (n === 3 && debts.length < 1) ||
            (n === 4 && transactions.length === 0);
          return (
            <button
              key={label}
              disabled={disabled}
              onClick={() => setStep(n)}
              className={`flex-1 text-left text-sm px-2 py-3 border-b-2 ${
                step === n ? "border-gold text-ink" : "border-transparent text-inkmuted"
              } disabled:text-inkfaint disabled:cursor-not-allowed`}
            >
              <span className={`font-mono text-xs mr-1.5 ${step === n ? "text-gold" : "text-inkfaint"}`}>
                {String(n).padStart(2, "0")}
              </span>
              {label}
            </button>
          );
        })}
      </div>

      {error && <p className="text-coral text-sm mb-3">{error}</p>}

      {step === 1 && (
        <Panel title="Who's in the group?" hint="Add every person involved in the shared expenses.">
          <div className="flex gap-2 mb-4 flex-wrap">
            <input
              className={inputClass}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addParticipant()}
              placeholder="e.g. Ali"
            />
            <button className={btnClass} onClick={addParticipant}>Add participant</button>
          </div>
          <List
            items={participants.map((p) => ({ id: p.id, label: p.name }))}
            emptyText="No participants yet — add at least two to continue."
            onRemove={removeParticipant}
          />
          <Nav>
            <span />
            <button className={btnClass} disabled={participants.length < 2} onClick={() => setStep(2)}>
              Next: add debts →
            </button>
          </Nav>
        </Panel>
      )}

      {step === 2 && (
        <Panel title="Log the debts" hint="Record each raw IOU as it actually happened — the optimizer untangles it next.">
          <div className="flex gap-2 mb-4 flex-wrap items-center">
            <select className={inputClass} value={fromId} onChange={(e) => setFromId(e.target.value)}>
              <option value="">from…</option>
              {participants.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <span className="text-inkfaint text-sm">owes</span>
            <select className={inputClass} value={toId} onChange={(e) => setToId(e.target.value)}>
              <option value="">to…</option>
              {participants.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input
              type="number"
              className={`${inputClass} w-28 flex-none`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
            />
            <button className={btnClass} onClick={addDebt}>Add debt</button>
          </div>
          <List
            items={debts.map((d) => ({
              id: d.id,
              label: `${nameOf(d.fromId)} → ${nameOf(d.toId)}: $${d.amount.toFixed(2)}`,
            }))}
            emptyText="No debts yet — add at least one."
            onRemove={removeDebt}
          />
          <Nav>
            <button className={ghostBtnClass} onClick={() => setStep(1)}>← Back</button>
            <button className={btnClass} disabled={debts.length < 1 || loading} onClick={runOptimizer}>
              {loading ? "Optimizing…" : "Next: optimize →"}
            </button>
          </Nav>
        </Panel>
      )}

      {step === 3 && (
        <Panel title="Settlement result" hint="The engine repeatedly matches the largest creditor with the largest debtor until every balance nets to zero.">
          <p className="text-inkmuted text-sm mb-4">
            {debts.length} raw debt(s) reduced to <strong className="text-teal">{transactions.length}</strong> transaction(s).
          </p>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="bg-panel2 border border-line rounded-lg p-3.5">
              <h3 className="font-mono text-[11px] uppercase text-coral mb-2">Before — raw debts</h3>
              <GraphView nodes={participants} edges={debts.map((d) => ({ from: d.fromId, to: d.toId, amount: d.amount }))} color="#c1666b" />
            </div>
            <div className="bg-panel2 border border-line rounded-lg p-3.5">
              <h3 className="font-mono text-[11px] uppercase text-teal mb-2">After — settlement</h3>
              <GraphView nodes={participants} edges={transactions} color="#4fb3a6" />
            </div>
          </div>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left text-[11px] uppercase text-inkfaint font-medium px-2 py-1.5 border-b border-line">From</th>
                <th className="text-left text-[11px] uppercase text-inkfaint font-medium px-2 py-1.5 border-b border-line">To</th>
                <th className="text-right text-[11px] uppercase text-inkfaint font-medium px-2 py-1.5 border-b border-line">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr><td colSpan={3} className="px-2 py-3 italic text-inkfaint">Everyone is already settled up.</td></tr>
              ) : (
                transactions.map((t, i) => (
                  <tr key={i}>
                    <td className="px-2 py-2 border-b border-panel2">{nameOf(t.from)}</td>
                    <td className="px-2 py-2 border-b border-panel2">{nameOf(t.to)}</td>
                    <td className="px-2 py-2 border-b border-panel2 text-right font-mono text-teal">${t.amount.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <Nav>
            <button className={ghostBtnClass} onClick={() => setStep(2)}>← Back</button>
            <button className={btnClass} onClick={loadReport}>Next: report →</button>
          </Nav>
        </Panel>
      )}

      {step === 4 && (
        <Panel title="Settlement report" hint="Plain-text summary you can hand to the group or attach to your project documentation.">
          <textarea
            readOnly
            value={report}
            className="w-full min-h-[240px] bg-panel2 border border-line text-ink font-mono text-xs leading-relaxed p-3.5 rounded-lg"
          />
          <Nav>
            <button className={ghostBtnClass} onClick={() => setStep(3)}>← Back</button>
            <button className={btnClass} onClick={downloadReport}>Download report (.txt)</button>
          </Nav>
        </Panel>
      )}

      <p className="text-inkfaint text-xs mt-7 text-center">Cash Flow Minimizer — Next.js + Prisma build.</p>
    </main>
  );
}

function Panel({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="bg-panel border border-line rounded-lg p-6">
      <h2 className="font-serif text-lg mb-1">{title}</h2>
      <p className="text-inkmuted text-sm mb-5 leading-relaxed">{hint}</p>
      {children}
    </section>
  );
}

function Nav({ children }: { children: React.ReactNode }) {
  return <div className="flex justify-between mt-5">{children}</div>;
}

function Metric({ label, value, last }: { label: string; value: string | number; last?: boolean }) {
  return (
    <div className={`bg-panel px-4.5 py-4 ${last ? "" : "border-r border-line"}`}>
      <div className="font-mono text-xl">{value}</div>
      <div className="text-[11px] text-inkmuted uppercase tracking-wide mt-0.5">{label}</div>
    </div>
  );
}

function List({
  items,
  emptyText,
  onRemove,
}: {
  items: { id: string; label: string }[];
  emptyText: string;
  onRemove: (id: string) => void;
}) {
  if (items.length === 0) {
    return <p className="text-inkfaint text-sm italic py-2">{emptyText}</p>;
  }
  return (
    <ul className="mb-2">
      {items.map((item) => (
        <li key={item.id} className="flex justify-between items-center py-2 px-1 border-b border-panel2 text-sm">
          <span>{item.label}</span>
          <button onClick={() => onRemove(item.id)} className="text-inkfaint hover:text-coral text-base px-1.5">
            &times;
          </button>
        </li>
      ))}
    </ul>
  );
}
