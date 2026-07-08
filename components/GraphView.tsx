"use client";

type GraphNode = { id: string; name: string };
type GraphEdge = { from: string; to: string; amount: number };

function layoutOnCircle(nodes: GraphNode[], size: number) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.36;
  return nodes.map((n, i) => {
    const angle = (2 * Math.PI * i) / Math.max(nodes.length, 1) - Math.PI / 2;
    return { ...n, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
}

export default function GraphView({
  nodes,
  edges,
  color,
  size = 320,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  color: string;
  size?: number;
}) {
  const positioned = layoutOnCircle(nodes, size);
  const posOf = (id: string) => positioned.find((n) => n.id === id);
  const markerId = `arrow-${color.replace("#", "")}`;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" role="img" aria-label="Debt relationship graph">
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M2 1L8 5L2 9" fill="none" stroke={color} strokeWidth={1.6} />
        </marker>
      </defs>

      {edges.map((e, i) => {
        const a = posOf(e.from);
        const b = posOf(e.to);
        if (!a || !b) return null;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const shrink = 22;
        const x1 = a.x + (dx / dist) * shrink;
        const y1 = a.y + (dy / dist) * shrink;
        const x2 = b.x - (dx / dist) * shrink;
        const y2 = b.y - (dy / dist) * shrink;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth={1.4}
            opacity={0.75}
            markerEnd={`url(#${markerId})`}
          />
        );
      })}

      {positioned.map((n) => (
        <g key={n.id}>
          <circle cx={n.x} cy={n.y} r={16} fill="#1d2538" stroke="#4a5372" strokeWidth={1} />
          <text x={n.x} y={n.y + 3.5} textAnchor="middle" fontSize={9.5} fill="#eae6db">
            {n.name.slice(0, 3)}
          </text>
        </g>
      ))}
    </svg>
  );
}
