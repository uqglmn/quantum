import { describe, expect, it, vi } from "vitest";
import type { Catalogue, DiagramRecord, Solution } from "../domain";
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
  reflectionEquationCertificate: null,
} satisfies Solution;

const record = {
  id: "a--n1",
  spec: { affineType: "A(1)", rank: 1, nodes: [0, 1], X: [], tau: [0, 1] },
  data: { cartanMatrix: [[2, -2], [-2, 2]], symmetrizers: [] },
  classification: { status: "Classified", family: "A.1", candidateFamilies: ["A.1"], regime: "MainCatalogue", equation: "Standard", parameters: {} },
  qsp: {
    qspId: "a--n1--qsp", status: "instantiatedPresentation", nameLatex: "B", ambientAlgebraLatex: "U_q(g)",
    indexSets: { nodes: [0, 1], levi: [], boundary: [0, 1], torusOrbitRepresentatives: [0, 1] },
    theta: { kind: "KolbQuantumInvolution", longestParabolicWord: [], latex: "theta" },
    generatorGroups: [], presentationLatex: "B", parameters: { cNodes: [0, 1], sNodes: [0, 1], latex: "c,s" },
    relationStatus: "generatorPresentation", provenance: { Source: "fixture" },
  },
  reflectionEquation: {
    kind: "Standard", status: "instantiatedIdentity", latex: "RE", rMatrixId: "a--r",
    verification: { status: "notComputed", method: null, certificateIds: [] },
    conventions: { spectralParameters: "multiplicative", legNumbering: "12/21", partialTranspose: null },
  },
  capabilities: { qspAlgebra: true, kMatrix: true, rMatrix: true, properties: [], remoteComputation: false },
  computation: { status: "Computed", solution, candidates: [] },
} satisfies DiagramRecord;

const ambient = {
  representation: {
    representationId: "a--vector", kind: "vectorEvaluation", dimension: 2,
    basisLabels: [1, 2], spectralParameter: "u", quantumParameter: "q", tensorBasisConvention: "lexicographic",
  },
  rMatrix: {
    rMatrixId: "a--r", status: "materialized", formulaKind: "untwistedTypeA", dimension: 4,
    latex: "R(u)=P", operatorDefinitions: [],
    matrix: { kind: "sparseMatrix", dimensions: [4, 4], indexBase: 0, entries: [] },
    matrixParameters: ["u", "q"], crossingParameterSquared: null,
    normalizationLatex: "R(1)=P", properties: [], provenance: { Source: "fixture" },
  },
} satisfies Catalogue["ambient"];

describe("solution exports", () => {
  it("preserves engine, diagram, and solution provenance", () => {
    vi.setSystemTime(new Date("2026-08-17T12:00:00Z"));
    const bundle = buildSolutionBundle(record, solution, { name: "QREKMatrices", version: "0.14.0" }, ambient);
    expect(bundle.diagram.id).toBe(record.id);
    expect(bundle.solution.provenance).toEqual({ Source: "fixture" });
    expect(bundle.diagram.qsp.qspId).toBe("a--n1--qsp");
    expect(bundle.ambient.rMatrix.rMatrixId).toBe("a--r");
    expect(bundle.exportedAt).toBe("2026-08-17T12:00:00.000Z");
    vi.useRealTimers();
  });

  it("creates a self-describing LaTeX fragment and safe filename", () => {
    expect(solutionLatexDocument(record, solution, ambient)).toContain("% Family: A.1");
    expect(solutionLatexDocument(record, solution, ambient)).toContain("R(u)=P");
    expect(safeFilename("A(1) / A.1 matrix")).toBe("a-1-a.1-matrix");
  });
});
