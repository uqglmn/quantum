import type { DiagramRecord, DiagramSummary } from "../domain";

type Point = { x: number; y: number };

type DrawableDiagram = DiagramRecord | DiagramSummary;

function nodePositions(record: DrawableDiagram): Point[] {
  const { affineType, nodes } = record.spec;
  const n = nodes.length - 1;
  const width = 440;
  if (affineType === "A(1)") {
    const radius = Math.min(145, 24 * nodes.length);
    return nodes.map((_, index) => ({
      x: width / 2 + radius * Math.cos(-Math.PI / 2 + (2 * Math.PI * index) / nodes.length),
      y: 112 + radius * 0.55 * Math.sin(-Math.PI / 2 + (2 * Math.PI * index) / nodes.length),
    }));
  }

  const points = nodes.map((_, index) => ({ x: 42 + (356 * index) / Math.max(n, 1), y: 112 }));
  const leftFork = affineType === "B(1)" || affineType === "A2n-1(2)" || affineType === "D(1)";
  const rightFork = affineType === "A2n-1(2)T" || affineType === "D(1)";
  if (leftFork && n >= 2) {
    points[0] = { x: 44, y: 77 };
    points[1] = { x: 44, y: 147 };
    for (let i = 2; i <= n; i += 1) points[i] = { x: 105 + ((i - 2) * 290) / Math.max(n - 2, 1), y: 112 };
  }
  if (rightFork && n >= 3) {
    const branch = n - 2;
    for (let i = leftFork ? 2 : 0; i <= branch; i += 1) {
      const start = leftFork ? 105 : 44;
      points[i] = { x: start + ((i - (leftFork ? 2 : 0)) * (330 - start)) / Math.max(branch - (leftFork ? 2 : 0), 1), y: 112 };
    }
    points[n - 1] = { x: 396, y: 77 };
    points[n] = { x: 396, y: 147 };
  }
  return points;
}

function parallelOffset(a: Point, b: Point, amount: number): [number, number] {
  const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return [(-(b.y - a.y) / length) * amount, ((b.x - a.x) / length) * amount];
}

export function SatakeDiagram({ record, compact = false }: { record: DrawableDiagram; compact?: boolean }) {
  const positions = nodePositions(record);
  const markerKey = record.id.replace(/[^a-zA-Z0-9_-]/g, "-");
  const edges: Array<{ i: number; j: number; multiplicity: number; short: number | null }> = [];
  record.data.cartanMatrix.forEach((row, i) => row.forEach((entry, j) => {
    if (j <= i || entry === 0) return;
    const reverse = record.data.cartanMatrix[j][i];
    edges.push({
      i,
      j,
      multiplicity: Math.max(Math.abs(entry), Math.abs(reverse)),
      short: Math.abs(entry) === Math.abs(reverse) ? null : (Math.abs(entry) > Math.abs(reverse) ? i : j),
    });
  }));
  const tauPairs = record.spec.nodes
    .filter((i) => record.spec.tau[i] !== i && i < record.spec.tau[i])
    .map((i) => [i, record.spec.tau[i]] as const);

  return (
    <svg className={`satake ${compact ? "satake--compact" : ""}`} viewBox="0 0 440 225" role="img"
      aria-label={`Generalized Satake diagram ${record.id}`}>
      <title>{record.classification.family ?? "Generalized"} Satake diagram</title>
      <desc>Black nodes form X. Grey double-headed arrows show the nontrivial orbits of tau.</desc>
      <defs>
        <marker id={`dynkin-arrow-${markerKey}`} markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="var(--ink)" />
        </marker>
        <marker id={`tau-arrow-${markerKey}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto-start-reverse">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--tau)" />
        </marker>
      </defs>
      {tauPairs.map(([i, j]) => {
        const a = positions[i]; const b = positions[j];
        const lift = Math.max(34, Math.abs(b.x - a.x) * 0.28);
        return <path key={`tau-${i}-${j}`} className="dg-tau"
          d={`M ${a.x} ${a.y - 11} Q ${(a.x + b.x) / 2} ${Math.min(a.y, b.y) - lift} ${b.x} ${b.y - 11}`}
          markerStart={`url(#tau-arrow-${markerKey})`} markerEnd={`url(#tau-arrow-${markerKey})`} />;
      })}
      {edges.flatMap((edge) => {
        const a = positions[edge.i]; const b = positions[edge.j];
        return Array.from({ length: edge.multiplicity }, (_, k) => {
          const offset = (k - (edge.multiplicity - 1) / 2) * 6;
          const [dx, dy] = parallelOffset(a, b, offset);
          const reverse = edge.short === edge.i;
          const from = reverse ? b : a; const to = reverse ? a : b;
          return <line key={`${edge.i}-${edge.j}-${k}`} className="dg-edge"
            x1={from.x + dx} y1={from.y + dy} x2={to.x + dx} y2={to.y + dy}
            markerEnd={edge.short !== null && k === Math.floor(edge.multiplicity / 2) ? `url(#dynkin-arrow-${markerKey})` : undefined} />;
        });
      })}
      {record.spec.nodes.map((node) => {
        const point = positions[node]; const black = record.spec.X.includes(node);
        return <g key={node} transform={`translate(${point.x},${point.y})`}>
          <circle className={black ? "dg-node dg-node--filled" : "dg-node dg-node--open"} r="7" />
          <text className="dg-label" y="-15">{node}</text>
        </g>;
      })}
    </svg>
  );
}
