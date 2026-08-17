import { describe, expect, it } from "vitest";
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
});
