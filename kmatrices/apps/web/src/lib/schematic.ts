import type { SchematicBrace, SchematicCap, SchematicToken, SchematicVariant } from "../domain";

/**
 * Layout engine for arbitrary-rank generalized Satake diagrams.
 *
 * The engine exports schematics as flat token streams carrying no geometry:
 * a "dashed" link stands for a run of arbitrary admissible length, which is
 * what makes a schematic rank-independent. All coordinates are derived here.
 */

export interface Scale {
  step: number;
  gap: number;
  rad: number;
  fork: number;
  row: number;
}

export const HERO_SCALE: Scale = { step: 40, gap: 88, rad: 7.5, fork: 19, row: 30 };
export const MINI_SCALE: Scale = { step: 17, gap: 27, rad: 3.6, fork: 9, row: 12 };

export type Primitive =
  | { t: "line"; x1: number; y1: number; x2: number; y2: number; cls: string }
  | { t: "path"; d: string; cls: string }
  | { t: "circle"; cx: number; cy: number; r: number; cls: string }
  | { t: "text"; x: number; y: number; anchor: "start" | "middle" | "end"; cls: string; value: string }
  | { t: "tau"; x1: number; y1: number; x2: number; y2: number };

export interface Layout {
  width: number;
  minY: number;
  maxY: number;
  primitives: Primitive[];
}

const SUBSCRIPTS: Record<string, string> = {
  "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
  "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
  i: "ᵢ", j: "ⱼ", n: "\u2099", r: "ᵣ",
};

const LATEX_TO_TEXT: Array<[RegExp, string]> = [
  [/_\{?([0-9ijnr])\}?/g, (_m: string, d: string) => SUBSCRIPTS[d] ?? `_${d}`] as unknown as [RegExp, string],
  [/\\ell/g, "ℓ"],
  [/\\lfloor/g, "⌊"],
  [/\\rfloor/g, "⌋"],
  [/\\bar\{([^}]*)\}/g, "$1̄"],
  [/\\!/g, ""],
  [/\\,/g, ""],
  [/\\;/g, ""],
  [/\$/g, ""],
  [/-/g, "−"],
];

/** Node labels are short LaTeX fragments; SVG text needs plain characters. */
export function labelToText(latex: string | null | undefined): string {
  if (!latex) return "";
  return LATEX_TO_TEXT.reduce(
    (acc, [re, to]) => acc.replace(re, to as unknown as string),
    latex,
  ).trim();
}

function isNode(token: SchematicToken): token is Extract<SchematicToken, { kind: "node" }> {
  return token.kind === "node";
}

interface PlacedNode {
  x: number;
  fill: "black" | "white";
  label: string | null;
  position: "above" | "below" | "left" | "right";
}

interface PlacedLink {
  a: number;
  b: number;
  style: "solid" | "dashed" | "double";
  arrow: "left" | "right" | null;
}

function walk(tokens: SchematicToken[], x0: number, s: Scale) {
  const nodes: PlacedNode[] = [];
  const links: PlacedLink[] = [];
  let x = x0;
  for (const token of tokens) {
    if (isNode(token)) {
      nodes.push({ x, fill: token.fill, label: token.label, position: token.position });
    } else {
      links.push({ a: nodes.length - 1, b: nodes.length, style: token.style, arrow: token.arrow });
      x += token.style === "dashed" ? s.gap : s.step;
    }
  }
  return { nodes, links, end: x };
}

class Canvas {
  primitives: Primitive[] = [];
  minY = Infinity;
  maxY = -Infinity;

  mark(y: number) {
    if (y < this.minY) this.minY = y;
    if (y > this.maxY) this.maxY = y;
  }

  push(primitive: Primitive) {
    this.primitives.push(primitive);
  }

  edge(x1: number, y1: number, x2: number, y2: number, link: Pick<PlacedLink, "style" | "arrow">, s: Scale) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const ax = x1 + ux * s.rad;
    const ay = y1 + uy * s.rad;
    const bx = x2 - ux * s.rad;
    const by = y2 - uy * s.rad;
    if (link.style === "double") {
      const px = -uy * 2.3;
      const py = ux * 2.3;
      this.push({ t: "line", x1: ax + px, y1: ay + py, x2: bx + px, y2: by + py, cls: "dg-edge" });
      this.push({ t: "line", x1: ax - px, y1: ay - py, x2: bx - px, y2: by - py, cls: "dg-edge" });
      const mx = (ax + bx) / 2;
      const my = (ay + by) / 2;
      const dir = link.arrow === "left" ? -1 : 1;
      const h = s.rad * 0.72;
      const w = s.rad * 0.62;
      this.push({
        t: "path",
        cls: "dg-arrow",
        d: `M${mx + dir * h},${my} L${mx - dir * h * 0.75},${my - w} L${mx - dir * h * 0.75},${my + w} Z`,
      });
    } else {
      this.push({
        t: "line", x1: ax, y1: ay, x2: bx, y2: by,
        cls: link.style === "dashed" ? "dg-edge dg-edge--dashed" : "dg-edge",
      });
    }
  }

  node(nd: PlacedNode, y: number, s: Scale, showLabel: boolean) {
    this.mark(y - s.rad - 1);
    this.mark(y + s.rad + 1);
    this.push({
      t: "circle", cx: nd.x, cy: y, r: s.rad,
      cls: `dg-node dg-node--${nd.fill === "black" ? "filled" : "open"}`,
    });
    if (!showLabel || !nd.label) return;
    const cls = /\\ell|(^|[^A-Za-z])r($|[^A-Za-z])/.test(nd.label) ? "dg-label dg-label--param" : "dg-label";
    const value = labelToText(nd.label);
    if (nd.position === "above") {
      this.mark(y - 24);
      this.push({ t: "text", x: nd.x, y: y - 14, anchor: "middle", cls, value });
    } else if (nd.position === "below") {
      this.mark(y + 27);
      this.push({ t: "text", x: nd.x, y: y + 23, anchor: "middle", cls, value });
    } else if (nd.position === "left") {
      this.mark(y - 9); this.mark(y + 9);
      this.push({ t: "text", x: nd.x - s.rad - 7, y: y + 4, anchor: "end", cls, value });
    } else {
      this.mark(y - 9); this.mark(y + 9);
      this.push({ t: "text", x: nd.x + s.rad + 7, y: y + 4, anchor: "start", cls, value });
    }
  }

  brace(x1: number, x2: number, y: number, dir: -1 | 1, label: string | null) {
    const c = 7;
    const m = (x1 + x2) / 2;
    const d = 6 * dir;
    this.push({
      t: "path", cls: "dg-brace",
      d: `M${x1},${y} q0,${d} ${c},${d} H${m - c} q${c},0 ${c},${d} q0,${-d} ${c},${-d} H${x2 - c} q${c},0 ${c},${-d}`,
    });
    if (label) {
      this.mark(dir < 0 ? y - 27 : y + 27);
      this.push({
        t: "text", x: m, y: dir < 0 ? y - 13 : y + 21,
        anchor: "middle", cls: "dg-brace-label", value: labelToText(label),
      });
    }
  }
}

function capIsFork(cap: SchematicCap): cap is Extract<SchematicCap, { kind: "fork" }> {
  return !!cap && cap !== "arc" && (cap as { kind: string }).kind === "fork";
}
function capIsNode(cap: SchematicCap): cap is Extract<SchematicCap, { kind: "node" }> {
  return !!cap && cap !== "arc" && (cap as { kind: string }).kind === "node";
}

function braceAnchor(
  ref: number | string, nodes: PlacedNode[], capLeftX: number | null, capRightX: number | null,
): number | null {
  if (ref === "capL" || ref === "cap") return capLeftX;
  if (ref === "capR") return capRightX;
  if (typeof ref === "number") return nodes[ref]?.x ?? null;
  return null;
}

function layoutLinear(v: SchematicVariant, s: Scale, showLabels: boolean, pad: number): Layout {
  const canvas = new Canvas();
  const cy = 0;
  const forkLeft = capIsFork(v.capLeft ?? null);
  const forkRight = capIsFork(v.capRight ?? null);
  const x0 = pad + (forkLeft ? s.step : 0);
  const { nodes, links } = walk(v.row ?? [], x0, s);
  let maxX = nodes.length ? nodes[nodes.length - 1].x : x0;

  if (forkLeft && nodes.length) {
    canvas.edge(pad, cy - s.fork, nodes[0].x, cy, { style: "solid", arrow: null }, s);
    canvas.edge(pad, cy + s.fork, nodes[0].x, cy, { style: "solid", arrow: null }, s);
  }
  if (forkRight && nodes.length) {
    const fx = maxX + s.step;
    canvas.edge(nodes[nodes.length - 1].x, cy, fx, cy - s.fork, { style: "solid", arrow: null }, s);
    canvas.edge(nodes[nodes.length - 1].x, cy, fx, cy + s.fork, { style: "solid", arrow: null }, s);
    maxX = fx;
  }
  links.forEach((l) => canvas.edge(nodes[l.a].x, cy, nodes[l.b].x, cy, l, s));

  const capLeftX = forkLeft ? pad : null;
  const capRightX = forkRight ? maxX : null;
  if (showLabels) (v.braces ?? []).forEach((br: SchematicBrace) => {
    const x1 = braceAnchor(br.from, nodes, capLeftX, capRightX);
    const x2 = braceAnchor(br.to, nodes, capLeftX, capRightX);
    if (x1 === null || x2 === null) return;
    const dir = br.side === "above" ? -1 : 1;
    const offset = (forkLeft || forkRight ? s.fork : 0) + 24;
    canvas.brace(Math.min(x1, x2), Math.max(x1, x2), cy + dir * offset, dir, showLabels ? br.label : null);
  });

  if (forkLeft && capIsFork(v.capLeft ?? null)) {
    const cap = v.capLeft as Extract<SchematicCap, { kind: "fork" }>;
    if (cap.tau) canvas.push({ t: "tau", x1: pad, y1: cy - s.fork + s.rad + 2, x2: pad, y2: cy + s.fork - s.rad - 2 });
    canvas.node({ x: pad, fill: cap.top.fill, label: cap.top.label, position: "left" }, cy - s.fork, s, showLabels);
    canvas.node({ x: pad, fill: cap.bottom.fill, label: cap.bottom.label, position: "left" }, cy + s.fork, s, showLabels);
  }
  if (forkRight && capIsFork(v.capRight ?? null)) {
    const cap = v.capRight as Extract<SchematicCap, { kind: "fork" }>;
    if (cap.tau) canvas.push({ t: "tau", x1: maxX, y1: cy - s.fork + s.rad + 2, x2: maxX, y2: cy + s.fork - s.rad - 2 });
    canvas.node({ x: maxX, fill: cap.top.fill, label: cap.top.label, position: "right" }, cy - s.fork, s, showLabels);
    canvas.node({ x: maxX, fill: cap.bottom.fill, label: cap.bottom.label, position: "right" }, cy + s.fork, s, showLabels);
  }
  nodes.forEach((nd) => canvas.node(nd, cy, s, showLabels));
  return { width: maxX + pad, minY: canvas.minY, maxY: canvas.maxY, primitives: canvas.primitives };
}

function layoutFolded(v: SchematicVariant, s: Scale, showLabels: boolean, pad: number): Layout {
  const canvas = new Canvas();
  const cy = 0;
  const yTop = cy - s.row;
  const yBottom = cy + s.row;
  const hasLeftCap = capIsNode(v.capLeft ?? null);
  const hasRightCap = capIsNode(v.capRight ?? null);
  const x0 = pad + s.step;
  const top = walk(v.top ?? [], x0, s);
  const bottom = walk(v.bottom ?? [], x0, s);
  const capLeftX = pad;
  const capRightX = top.nodes.length ? top.nodes[top.nodes.length - 1].x + s.step : x0;

  const join = (x: number, y: number, nx: number, ny: number) =>
    canvas.edge(x, y, nx, ny, { style: "solid", arrow: null }, s);

  if (top.nodes.length && bottom.nodes.length) {
    if (hasLeftCap) {
      join(capLeftX, cy, top.nodes[0].x, yTop);
      join(capLeftX, cy, bottom.nodes[0].x, yBottom);
    } else {
      // rounded fold: the two rows close directly into one another
      const x = top.nodes[0].x;
      canvas.push({
        t: "path", cls: "dg-edge",
        d: `M${x},${yTop} A${s.row},${s.row} 0 0 0 ${x},${yBottom}`,
      });
    }
    const lastTop = top.nodes[top.nodes.length - 1];
    const lastBottom = bottom.nodes[bottom.nodes.length - 1];
    if (hasRightCap) {
      join(lastTop.x, yTop, capRightX, cy);
      join(lastBottom.x, yBottom, capRightX, cy);
    } else {
      canvas.push({
        t: "path", cls: "dg-edge",
        d: `M${lastTop.x},${yTop} A${s.row},${s.row} 0 0 1 ${lastTop.x},${yBottom}`,
      });
    }
  }
  top.links.forEach((l) => canvas.edge(top.nodes[l.a].x, yTop, top.nodes[l.b].x, yTop, l, s));
  bottom.links.forEach((l) => canvas.edge(bottom.nodes[l.a].x, yBottom, bottom.nodes[l.b].x, yBottom, l, s));

  if (v.rungs) {
    top.nodes.forEach((nd, i) => {
      if (!bottom.nodes[i]) return;
      canvas.push({ t: "tau", x1: nd.x, y1: yTop + s.rad + 2, x2: nd.x, y2: yBottom - s.rad - 2 });
    });
  }

  if (showLabels) (v.braces ?? []).forEach((br: SchematicBrace) => {
    const x1 = braceAnchor(br.from, top.nodes, hasLeftCap ? capLeftX : top.nodes[0]?.x ?? null,
      hasRightCap ? capRightX : top.nodes[top.nodes.length - 1]?.x ?? null);
    const x2 = braceAnchor(br.to, top.nodes, hasLeftCap ? capLeftX : top.nodes[0]?.x ?? null,
      hasRightCap ? capRightX : top.nodes[top.nodes.length - 1]?.x ?? null);
    if (x1 === null || x2 === null) return;
    canvas.brace(Math.min(x1, x2), Math.max(x1, x2), yTop - 24, -1, showLabels ? br.label : null);
  });

  if (hasLeftCap) {
    const cap = v.capLeft as Extract<SchematicCap, { kind: "node" }>;
    canvas.node({ x: capLeftX, fill: cap.fill, label: cap.label, position: "left" }, cy, s, showLabels);
  }
  if (hasRightCap) {
    const cap = v.capRight as Extract<SchematicCap, { kind: "node" }>;
    canvas.node({ x: capRightX, fill: cap.fill, label: cap.label, position: "right" }, cy, s, showLabels);
  }
  top.nodes.forEach((nd) => canvas.node(nd, yTop, s, showLabels));
  bottom.nodes.forEach((nd) => canvas.node(nd, yBottom, s, showLabels));
  const width = (hasRightCap ? capRightX : (top.nodes[top.nodes.length - 1]?.x ?? x0) + s.row) + pad;
  return { width, minY: canvas.minY, maxY: canvas.maxY, primitives: canvas.primitives };
}

function layoutCycle(v: SchematicVariant, s: Scale, showLabels: boolean, pad: number): Layout {
  const canvas = new Canvas();
  const tokens = v.ring ?? [];
  const nodes = tokens.filter(isNode);
  const links = tokens.filter((t): t is Extract<SchematicToken, { kind: "link" }> => t.kind === "link");
  const count = nodes.length;
  const radius = Math.max(s.step * 1.15, s.rad * 5.2);
  const cx = pad + radius;
  const cy = 0;
  const angle = (i: number) => -Math.PI / 2 + (2 * Math.PI * i) / count;
  const px = (i: number) => cx + radius * Math.cos(angle(i));
  const py = (i: number) => cy + radius * Math.sin(angle(i));

  links.forEach((link, i) => {
    const a = i;
    const b = (i + 1) % count;
    if (a >= count) return;
    const a0 = angle(a);
    const a1 = angle(b) + (b === 0 ? 2 * Math.PI : 0);
    const trim = s.rad / radius;
    const sx = cx + radius * Math.cos(a0 + trim);
    const sy = cy + radius * Math.sin(a0 + trim);
    const ex = cx + radius * Math.cos(a1 - trim);
    const ey = cy + radius * Math.sin(a1 - trim);
    canvas.push({
      t: "path",
      cls: link.style === "dashed" ? "dg-edge dg-edge--dashed" : "dg-edge",
      d: `M${sx},${sy} A${radius},${radius} 0 0 1 ${ex},${ey}`,
    });
  });

  (v.tau ?? []).forEach(([a, b]) => {
    if (a >= count || b >= count) return;
    canvas.push({ t: "tau", x1: px(a), y1: py(a), x2: px(b), y2: py(b) });
  });

  nodes.forEach((nd, i) => {
    const x = px(i);
    const y = py(i);
    const cos = Math.cos(angle(i));
    const sin = Math.sin(angle(i));
    const position: PlacedNode["position"] =
      Math.abs(sin) > 0.8 ? (sin < 0 ? "above" : "below") : cos > 0 ? "right" : "left";
    canvas.node({ x, fill: nd.fill, label: nd.label, position }, y, s, showLabels);
  });
  canvas.mark(cy - radius - s.rad);
  canvas.mark(cy + radius + s.rad);
  return { width: cx + radius + pad, minY: canvas.minY, maxY: canvas.maxY, primitives: canvas.primitives };
}

export function layoutSchematic(
  variant: SchematicVariant,
  options: { scale?: Scale; labels?: boolean; pad?: number } = {},
): Layout {
  const scale = options.scale ?? HERO_SCALE;
  const labels = options.labels ?? true;
  const pad = options.pad ?? 46;
  if (variant.layout === "folded") return layoutFolded(variant, scale, labels, pad);
  if (variant.layout === "cycle") return layoutCycle(variant, scale, labels, pad);
  return layoutLinear(variant, scale, labels, pad);
}
