import type { FamilyFormulaBranch } from "../domain";

type Point = { x: number; top: number; bottom: number };

const columns: Point[] = [
  { x: 110, top: 58, bottom: 142 },
  { x: 190, top: 58, bottom: 142 },
  { x: 330, top: 58, bottom: 142 },
  { x: 410, top: 58, bottom: 142 },
];

function Pair({ point, black, topLabel, bottomLabel, marker }: {
  point: Point;
  black: boolean;
  topLabel?: string;
  bottomLabel?: string;
  marker: string;
}) {
  return <g>
    <line className="general-tau" x1={point.x} y1={point.top + 11} x2={point.x} y2={point.bottom - 11}
      markerStart={`url(#${marker})`} markerEnd={`url(#${marker})`} />
    <circle className={`general-node ${black ? "general-node--black" : ""}`} cx={point.x} cy={point.top} r="7" />
    <circle className={`general-node ${black ? "general-node--black" : ""}`} cx={point.x} cy={point.bottom} r="7" />
    {topLabel && <text className="general-node-label" x={point.x} y={point.top - 16}>{topLabel}</text>}
    {bottomLabel && <text className="general-node-label" x={point.x} y={point.bottom + 22}>{bottomLabel}</text>}
  </g>;
}

/** Paper-style schematic: dashed chains have arbitrary admissible length. */
export function A3GeneralDiagram({ branch }: { branch: FamilyFormulaBranch }) {
  const leftBoundary = branch.branchId === "left-boundary" || branch.branchId === "corner";
  const rightBoundary = branch.branchId === "right-boundary" || branch.branchId === "corner";
  const marker = `a3-general-${branch.branchId}`;
  const top = [
    `M 45 100 L ${columns[0].x} ${columns[0].top}`,
    `M ${columns[0].x} ${columns[0].top} L ${columns[1].x} ${columns[1].top}`,
    `M ${columns[1].x} ${columns[1].top} L ${columns[2].x} ${columns[2].top}`,
    `M ${columns[2].x} ${columns[2].top} L ${columns[3].x} ${columns[3].top}`,
    `M ${columns[3].x} ${columns[3].top} L 475 100`,
  ];
  const bottom = [
    `M 45 100 L ${columns[0].x} ${columns[0].bottom}`,
    `M ${columns[0].x} ${columns[0].bottom} L ${columns[1].x} ${columns[1].bottom}`,
    `M ${columns[1].x} ${columns[1].bottom} L ${columns[2].x} ${columns[2].bottom}`,
    `M ${columns[2].x} ${columns[2].bottom} L ${columns[3].x} ${columns[3].bottom}`,
    `M ${columns[3].x} ${columns[3].bottom} L 475 100`,
  ];

  return <svg className="a3-general-diagram" viewBox="0 0 520 220" role="img"
    aria-label={`${branch.label}, arbitrary-rank A.3 Satake diagram template`}>
    <title>{branch.label}: arbitrary-rank A.3 representative template</title>
    <desc>Dashed edges represent chains of arbitrary admissible length. Vertical double arrows represent tau-orbits.</desc>
    <defs><marker id={marker} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto-start-reverse">
      <path d="M0,0 L6,3 L0,6 Z" fill="var(--tau)" />
    </marker></defs>
    {[...top, ...bottom].map((path, index) => <path key={index}
      className={index % 5 === 1 || index % 5 === 2 || index % 5 === 3 ? "general-edge general-edge--omitted" : "general-edge"} d={path} />)}

    <circle className={`general-node ${leftBoundary ? "" : "general-node--black"}`} cx="45" cy="100" r="7" />
    <text className="general-node-label" x="30" y="104">{leftBoundary ? "0=ℓ" : "0"}</text>
    <Pair point={columns[0]} black={!leftBoundary} marker={marker} />
    <Pair point={columns[1]} black={false} marker={marker}
      topLabel={leftBoundary ? undefined : "ℓ"} bottomLabel={leftBoundary ? undefined : "t−ℓ"} />
    <Pair point={columns[2]} black={false} marker={marker}
      topLabel={rightBoundary ? undefined : "r"} bottomLabel={rightBoundary ? undefined : "t−r"} />
    <Pair point={columns[3]} black={!rightBoundary} marker={marker} />
    <circle className={`general-node ${rightBoundary ? "" : "general-node--black"}`} cx="475" cy="100" r="7" />
    <text className="general-node-label" x="490" y="104">{rightBoundary ? "r=⌊t/2⌋" : "⌊t/2⌋"}</text>

    <text className="general-ellipsis" x="150" y="45">⋯</text>
    <text className="general-ellipsis" x="260" y="45">⋯</text>
    <text className="general-ellipsis" x="370" y="45">⋯</text>
    <text className="general-ellipsis" x="150" y="169">⋯</text>
    <text className="general-ellipsis" x="260" y="169">⋯</text>
    <text className="general-ellipsis" x="370" y="169">⋯</text>
    <text className="general-rank-caption" x="260" y="207" textAnchor="middle">
      rank n arbitrary (N=n+1) · t ∈ &#123;N−1,N&#125; · dashed chains have arbitrary length
    </text>
  </svg>;
}
