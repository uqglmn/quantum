import { describe, expect, it } from "vitest";
import type { SchematicVariant } from "../domain";
import { HERO_SCALE, labelToText, layoutSchematic } from "./schematic";

const node = (fill: "black" | "white", label: string | null = null) =>
  ({ kind: "node", fill, label, position: "above" }) as const;
const link = (style: "solid" | "dashed" | "double" = "solid", arrow: "left" | "right" | null = null) =>
  ({ kind: "link", style, arrow }) as const;

const linear: SchematicVariant = {
  variantId: "C.1", label: "Representative", layout: "linear",
  capLeft: null, capRight: null,
  row: [
    node("black", "0"), link("double", "right"), node("black", "1"),
    link("dashed"), node("black"), link(), node("white", String.raw`\ell`),
    link("dashed"), node("white", "r"), link(), node("black"),
    link("dashed"), node("black", "n-1"), link("double", "left"), node("black", "n"),
  ],
  braces: [
    { from: 0, to: 2, side: "below", label: "p_1" },
    { from: 5, to: 7, side: "below", label: "p_2" },
  ],
};

describe("labelToText", () => {
  it("renders LaTeX node labels as plain characters for SVG text", () => {
    expect(labelToText(String.raw`\ell`)).toBe("ℓ");
    expect(labelToText("n-1")).toBe("n−1");
    expect(labelToText(null)).toBe("");
  });
});

describe("layoutSchematic", () => {
  it("places one circle per node and keeps the box tight around the content", () => {
    const layout = layoutSchematic(linear);
    const circles = layout.primitives.filter((p) => p.t === "circle");
    expect(circles).toHaveLength(8);
    expect(layout.maxY).toBeGreaterThan(layout.minY);
    expect(Number.isFinite(layout.width)).toBe(true);
  });

  it("advances a dashed run further than a solid bond, which is what makes it read as arbitrary length", () => {
    const circles = layoutSchematic(linear).primitives.filter(
      (p): p is Extract<typeof p, { t: "circle" }> => p.t === "circle",
    );
    const solidGap = circles[1].cx - circles[0].cx;
    const dashedGap = circles[2].cx - circles[1].cx;
    expect(solidGap).toBeCloseTo(HERO_SCALE.step);
    expect(dashedGap).toBeCloseTo(HERO_SCALE.gap);
  });

  it("draws a filled arrowhead for each double bond", () => {
    const arrows = layoutSchematic(linear).primitives.filter(
      (p) => p.t === "path" && p.cls === "dg-arrow",
    );
    expect(arrows).toHaveLength(2);
  });

  it("marks the free parameters so they inherit the accent colour", () => {
    const labels = layoutSchematic(linear).primitives.filter(
      (p): p is Extract<typeof p, { t: "text" }> => p.t === "text",
    );
    const ell = labels.find((p) => p.value === "ℓ");
    const zero = labels.find((p) => p.value === "0");
    expect(ell?.cls).toContain("dg-label--param");
    expect(zero?.cls).toBe("dg-label");
  });

  it("suppresses labels and braces in miniature mode", () => {
    const mini = layoutSchematic(linear, { labels: false });
    expect(mini.primitives.some((p) => p.t === "text")).toBe(false);
    expect(mini.primitives.filter((p) => p.t === "circle")).toHaveLength(8);
  });

  it("joins a folded cycle with tau rungs and closes an open end with an arc", () => {
    const folded: SchematicVariant = {
      variantId: "A.3c", label: "Both ends flipped", layout: "folded",
      capLeft: "arc", capRight: "arc", rungs: true,
      top: [node("black"), link("dashed"), node("white", String.raw`\ell`)],
      bottom: [node("black"), link("dashed"), node("white", String.raw`N-\ell`)],
      braces: [],
    };
    const layout = layoutSchematic(folded);
    expect(layout.primitives.filter((p) => p.t === "tau")).toHaveLength(2);
    const arcs = layout.primitives.filter((p) => p.t === "path" && p.cls === "dg-edge");
    expect(arcs).toHaveLength(2);
  });

  it("lays a cyclic family out as a closed ring", () => {
    const cycle: SchematicVariant = {
      variantId: "A.1", label: "Representative", layout: "cycle",
      ring: [node("white", "0"), link(), node("white", "1"), link("dashed"),
        node("white", "n"), link()],
      tau: [], braces: [],
    };
    const layout = layoutSchematic(cycle);
    expect(layout.primitives.filter((p) => p.t === "circle")).toHaveLength(3);
    expect(layout.primitives.filter((p) => p.t === "path" && p.cls.startsWith("dg-edge"))).toHaveLength(3);
  });
});

describe("label subscripts", () => {
  it("renders brace labels with real subscript characters", () => {
    expect(labelToText("p_1")).toBe("p₁");
    expect(labelToText("p_2")).toBe("p₂");
  });
});
