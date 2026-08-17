import { describe, expect, it } from "vitest";
import type { FamilyRecord } from "../domain";
import { familiesForAffineType, familyDefinition, familyDefinitions, parameterLabel } from "./families";

describe("family registry", () => {
  it("has stable unique identifiers", () => {
    expect(new Set(familyDefinitions.map(({ id }) => id)).size).toBe(familyDefinitions.length);
  });

  it("covers every affine presentation exported by the current manifest", () => {
    const affineTypes = ["A(1)", "B(1)", "C(1)", "D(1)", "A2n-1(2)", "A2n-1(2)T", "A2n(2)", "A2n(2)T", "Dn+1(2)"];
    for (const affineType of affineTypes) expect(familiesForAffineType(affineType).length).toBeGreaterThan(0);
  });

  it("registers the theorem-level C.1 formula and mathematical parameter labels", () => {
    const c1 = familyDefinition("C.1");
    expect(c1?.formula?.latex).toContain("M_2(u)");
    expect(c1?.formula?.definitions).toHaveLength(4);
    expect(parameterLabel("l")).toBe("ℓ");
  });

  it("records the zero-only vector result for exceptional D.3", () => {
    expect(familyDefinition("D.3")?.formula?.latex).toBe(String.raw`K(u)=0`);
  });

  it("prefers authoritative exported family content to the compatibility registry", () => {
    const exported: FamilyRecord = {
      familyId: "A.1",
      title: "Exported A.1",
      affineTypes: ["A(1)"],
      description: "Engine-owned description.",
      contentStatus: "published",
      regimes: ["quasistandard"],
      parameterOrder: [],
      parameterDomain: { parameters: [], constraints: [], branches: [] },
      generalFormula: {
        kind: "closedForm",
        status: "published",
        latex: String.raw`K(u)=I_N`,
        expression: { kind: "symbol", name: "IdentityMatrix" },
        definitions: [],
        assumptionsLatex: String.raw`N>2`,
        sourceAnchors: [{ source: "engine", anchor: "A.1", role: "formula" }],
      },
      properties: [],
      sourceAnchors: [],
      instanceIds: ["A(1)-n2-X0-tau0"],
    };

    const a1 = familyDefinition("A.1", [exported]);
    expect(a1?.title).toBe("Exported A.1");
    expect(a1?.description).toBe("Engine-owned description.");
    expect(a1?.formula?.latex).toBe(String.raw`K(u)=I_N`);
    expect(a1?.formula?.source).toBe("engine, A.1");
  });
});
