import { describe, expect, it } from "vitest";
import type { CatalogueManifest } from "../domain";
import { familyFiles, nearestFamilyFile } from "./catalogue";

const files: CatalogueManifest["files"] = [2, 3, 4, 5, 6].map((rank) => ({
  id: `a-1--n${rank}`,
  affineType: "A(1)",
  rank,
  path: `a-1--n${rank}.json`,
  diagramCount: 1,
  layout: "lazy-v1" as const,
  detailBasePath: `details/a-1--n${rank}`,
  detailCount: 1,
  families: rank % 2 === 1 ? ["A.1", "A.2", "A.4"] : ["A.1", "A.3"],
})).concat([4, 5, 6].map((rank) => ({
  id: `d-1--n${rank}`,
  affineType: "D(1)",
  rank,
  path: `d-1--n${rank}.json`,
  diagramCount: 1,
  layout: "lazy-v1" as const,
  detailBasePath: `details/d-1--n${rank}`,
  detailCount: 1,
  families: rank === 4 ? ["D.1", "D.3"] : ["D.1"],
})));

describe("family-aware catalogue navigation", () => {
  it("exposes only ranks containing the selected family", () => {
    expect(familyFiles(files, "A(1)", "A.2").map(({ rank }) => rank)).toEqual([3, 5]);
    expect(familyFiles(files, "A(1)", "A.4").map(({ rank }) => rank)).toEqual([3, 5]);
  });

  it("keeps a compatible rank and moves an incompatible rank to the nearest one", () => {
    expect(nearestFamilyFile(files, "A(1)", "A.2", 5)?.rank).toBe(5);
    expect(nearestFamilyFile(files, "A(1)", "A.2", 6)?.rank).toBe(5);
    expect(nearestFamilyFile(files, "A(1)", "A.4", 2)?.rank).toBe(3);
  });

  it("uses the lower rank to break an equal-distance tie", () => {
    expect(nearestFamilyFile(files, "A(1)", "A.2", 4)?.rank).toBe(3);
  });

  it("moves the exceptional D.3 family to its sole supported rank", () => {
    expect(familyFiles(files, "D(1)", "D.3").map(({ rank }) => rank)).toEqual([4]);
    expect(nearestFamilyFile(files, "D(1)", "D.3", 6)?.rank).toBe(4);
  });
});
