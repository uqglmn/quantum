import { useMemo } from "react";
import type { SchematicVariant } from "../domain";
import { HERO_SCALE, MINI_SCALE, layoutSchematic, type Layout } from "../lib/schematic";

function Primitives({ layout }: { layout: Layout }) {
  return <>
    {layout.primitives.map((p, index) => {
      switch (p.t) {
        case "line":
          return <line key={index} className={p.cls} x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} />;
        case "path":
          return <path key={index} className={p.cls} d={p.d} />;
        case "circle":
          return <circle key={index} className={p.cls} cx={p.cx} cy={p.cy} r={p.r} />;
        case "text":
          return <text key={index} className={p.cls} x={p.x} y={p.y} textAnchor={p.anchor}>{p.value}</text>;
        case "tau":
          return <line key={index} className="dg-tau" x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2}
            markerStart="url(#tau-head)" markerEnd="url(#tau-head)" />;
        default:
          return null;
      }
    })}
  </>;
}

const TAU_MARKER = <defs>
  <marker id="tau-head" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto-start-reverse">
    <path d="M0,0 L6,3 L0,6 Z" fill="var(--tau)" />
  </marker>
</defs>;

/** The arbitrary-rank diagram, drawn as in the source tables. */
export function SatakeSchematic({ variant, description }: {
  variant: SchematicVariant;
  description?: string;
}) {
  const layout = useMemo(() => layoutSchematic(variant, { scale: HERO_SCALE, pad: 46 }), [variant]);
  const pad = 8;
  const minY = layout.minY - pad;
  const height = layout.maxY - layout.minY + pad * 2;
  return <svg className="schematic" role="img"
    viewBox={`0 ${minY} ${layout.width} ${height}`}
    style={{ width: `${layout.width}px`, maxWidth: "100%", height: "auto" }}
    preserveAspectRatio="xMidYMid meet"
    aria-label={description ?? `Generalized Satake diagram ${variant.variantId}`}>
    {TAU_MARKER}
    <Primitives layout={layout} />
  </svg>;
}

/** Shape-only miniature used by the family index. */
export function SatakeMiniature({ variant }: { variant: SchematicVariant }) {
  const layout = useMemo(
    () => layoutSchematic(variant, { scale: MINI_SCALE, labels: false, pad: 8 }),
    [variant],
  );
  const pad = 3;
  const minY = layout.minY - pad;
  const height = layout.maxY - layout.minY + pad * 2;
  return <svg className="schematic-mini" aria-hidden="true" focusable="false"
    viewBox={`0 ${minY} ${layout.width} ${height}`} preserveAspectRatio="xMidYMid meet">
    {TAU_MARKER}
    <Primitives layout={layout} />
  </svg>;
}
