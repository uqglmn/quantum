import type { Catalogue, DiagramRecord, Solution } from "../domain";

export function buildSolutionBundle(
  record: DiagramRecord,
  solution: Solution,
  engine: Catalogue["engine"],
  ambient: Catalogue["ambient"],
) {
  return {
    schemaVersion: "1.5.0",
    engine,
    exportedAt: new Date().toISOString(),
    diagram: {
      id: record.id,
      spec: record.spec,
      classification: record.classification,
      familyMemberships: record.familyMemberships,
      cartanMatrix: record.data.cartanMatrix,
      symmetrizers: record.data.symmetrizers,
      qsp: record.qsp,
      reflectionEquation: record.reflectionEquation,
    },
    ambient,
    solution,
  };
}

export function solutionLatexDocument(
  record: DiagramRecord,
  solution: Solution,
  ambient: Catalogue["ambient"],
): string {
  const parameters = Object.keys(solution.parameters).join(", ") || "none";
  const transformations = solution.transformations.flatMap((transformation) => [
    `% Transformation: ${transformation.kind}`,
    ...(transformation.latex ? ["\\[", transformation.latex, "\\]"] : []),
  ]);
  const properties = solution.properties.flatMap((property) => [
    `% Property: ${property.label}; status: ${property.status}; method: ${property.verification.method}`,
    "\\[",
    property.latex,
    "\\]",
  ]);
  return [
    `% QREKMatrices solution ${solution.solutionId}`,
    `% Diagram: ${record.spec.affineType}, n=${record.spec.rank}, X={${record.spec.X.join(",")}}, tau=[${record.spec.tau.join(",")}]`,
    `% Family: ${solution.family}; equation: ${solution.equation}; realization: ${solution.realization}`,
    `% Basis: ${solution.basisLabels.join(", ")}; parameters: ${parameters}`,
    `% Ambient R record: ${ambient.rMatrix.rMatrixId}; normalization: ${ambient.rMatrix.normalizationLatex}`,
    `\\[`,
    record.qsp.presentationLatex,
    `\\]`,
    `\\[`,
    ambient.rMatrix.latex,
    `\\]`,
    `\\[`,
    record.reflectionEquation.latex,
    `\\]`,
    `\\[`,
    `K(u) = ${solution.latex}`,
    `\\]`,
    ...transformations,
    ...properties,
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
