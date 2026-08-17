import { describe, expect, it } from "vitest";
import type { DiagramSummary } from "../domain";
import { formulaBranchId } from "./formulaBranches";

function record(l: number, r: number, t: number, exported: string | null = null): DiagramSummary {
  const integer = (value: number) => ({ kind: "integer", value: String(value) } as const);
  return {
    id: `${l}-${r}-${t}`,
    spec: { affineType: "A(1)", rank: 5, nodes: [0, 1, 2, 3, 4, 5], X: [], tau: [0, 1, 2, 3, 4, 5] },
    data: { cartanMatrix: [], symmetrizers: [] },
    classification: { status: "Classified", family: "A.3", candidateFamilies: ["A.3"], regime: "MainCatalogue", equation: "Standard", parameters: { l: integer(l), r: integer(r), t: integer(t) } },
    familyMemberships: [{ familyId: "A.3", membershipStatus: "classified", regime: "MainCatalogue", formulaBranchId: exported, parameters: {}, representative: true, transportPermutation: null }],
    capabilities: { qspAlgebra: true, kMatrix: true, rMatrix: true, properties: [], remoteComputation: false },
    detailPath: "fixture.json",
  };
}

describe("A.3 formula strata", () => {
  it("partitions the parameter domain into four disjoint cases", () => {
    expect(formulaBranchId(record(1, 2, 6), "A.3")).toBe("interior");
    expect(formulaBranchId(record(0, 2, 6), "A.3")).toBe("left-boundary");
    expect(formulaBranchId(record(1, 3, 6), "A.3")).toBe("right-boundary");
    expect(formulaBranchId(record(0, 3, 6), "A.3")).toBe("corner");
  });

  it("prefers the engine-owned branch identifier", () => {
    expect(formulaBranchId(record(1, 2, 6, "corner"), "A.3")).toBe("corner");
  });
});
