import { describe, expect, it, vi } from "vitest";
import type { DiagramRecord, Solution } from "../domain";
import { buildSolutionBundle, safeFilename, solutionLatexDocument } from "./solutionExport";

const solution = {
  solutionId: "a--a.1--1",
  family: "A.1",
  equation: "Standard",
  realization: "bare",
  transformations: [],
  basisLabels: [1, 2],
  parameters: {},
  matrix: { kind: "sparseMatrix", dimensions: [2, 2], indexBase: 0, entries: [] },
  latex: "\\begin{pmatrix}1&0\\\\0&1\\end{pmatrix}",
  provenance: { Source: "fixture" },
} satisfies Solution;

const record = {
  id: "a--n1",
  spec: { affineType: "A(1)", rank: 1, nodes: [0, 1], X: [], tau: [0, 1] },
  data: { cartanMatrix: [[2, -2], [-2, 2]], symmetrizers: [] },
  classification: { status: "Classified", family: "A.1", candidateFamilies: ["A.1"], regime: "MainCatalogue", equation: "Standard", parameters: {} },
  capabilities: { qspAlgebra: false, kMatrix: true, rMatrix: false, properties: [], remoteComputation: false },
  computation: { status: "Computed", solution, candidates: [] },
} satisfies DiagramRecord;

describe("solution exports", () => {
  it("preserves engine, diagram, and solution provenance", () => {
    vi.setSystemTime(new Date("2026-08-17T12:00:00Z"));
    const bundle = buildSolutionBundle(record, solution, { name: "QREKMatrices", version: "0.11.0" });
    expect(bundle.diagram.id).toBe(record.id);
    expect(bundle.solution.provenance).toEqual({ Source: "fixture" });
    expect(bundle.exportedAt).toBe("2026-08-17T12:00:00.000Z");
    vi.useRealTimers();
  });

  it("creates a self-describing LaTeX fragment and safe filename", () => {
    expect(solutionLatexDocument(record, solution)).toContain("% Family: A.1");
    expect(safeFilename("A(1) / A.1 matrix")).toBe("a-1-a.1-matrix");
  });
});
