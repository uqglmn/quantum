import type { Catalogue, DiagramRecord, Solution } from "../domain";

export function buildSolutionBundle(
  record: DiagramRecord,
  solution: Solution,
  engine: Catalogue["engine"],
) {
  return {
    schemaVersion: "1.0.0",
    engine,
    exportedAt: new Date().toISOString(),
    diagram: {
      id: record.id,
      spec: record.spec,
      classification: record.classification,
      cartanMatrix: record.data.cartanMatrix,
      symmetrizers: record.data.symmetrizers,
    },
    solution,
  };
}

export function solutionLatexDocument(record: DiagramRecord, solution: Solution): string {
  const parameters = Object.keys(solution.parameters).join(", ") || "none";
  return [
    `% QREKMatrices solution ${solution.solutionId}`,
    `% Diagram: ${record.spec.affineType}, n=${record.spec.rank}, X={${record.spec.X.join(",")}}, tau=[${record.spec.tau.join(",")}]`,
    `% Family: ${solution.family}; equation: ${solution.equation}; realization: ${solution.realization}`,
    `% Basis: ${solution.basisLabels.join(", ")}; parameters: ${parameters}`,
    `\\[`,
    `K(u) = ${solution.latex}`,
    `\\]`,
    "",
  ].join("\n");
}

export function safeFilename(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9.-]+/g, "-").replace(/^-|-$/g, "");
}

export function downloadText(filename: string, content: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
