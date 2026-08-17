import type { Catalogue, DiagramRecord, Expression, Solution, SparseMatrix } from "../domain";

export function buildSolutionBundle(
  record: DiagramRecord,
  solution: Solution,
  engine: Catalogue["engine"],
  ambient: Catalogue["ambient"],
) {
  return {
    schemaVersion: "1.7.0",
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

function wolframSymbol(name: string): string {
  return /^[\p{L}$][\p{L}\p{N}$]*$/u.test(name) ? name : `Symbol[${JSON.stringify(name)}]`;
}

export function expressionToWolfram(expression: Expression): string {
  switch (expression.kind) {
    case "integer":
    case "real":
      return expression.value;
    case "rational":
      return `Rational[${expression.numerator}, ${expression.denominator}]`;
    case "string":
      return JSON.stringify(expression.value);
    case "symbol":
      return wolframSymbol(expression.name);
    case "complex":
      return `Complex[${expressionToWolfram(expression.real)}, ${expressionToWolfram(expression.imaginary)}]`;
    case "call":
      return `${wolframSymbol(expression.head)}[${expression.arguments.map(expressionToWolfram).join(", ")}]`;
    case "sparseMatrix":
      return sparseMatrixToWolfram(expression);
  }
}

function sparseMatrixToWolfram(matrix: SparseMatrix): string {
  const rules = matrix.entries.map(({ index, value }) =>
    `{${index[0] + 1}, ${index[1] + 1}} -> ${expressionToWolfram(value)}`);
  return `SparseArray[{${rules.join(", ")}}, {${matrix.dimensions.join(", ")}}]`;
}

function expressionSymbols(expression: Expression, symbols = new Set<string>()): Set<string> {
  if (expression.kind === "symbol") symbols.add(expression.name);
  if (expression.kind === "complex") {
    expressionSymbols(expression.real, symbols);
    expressionSymbols(expression.imaginary, symbols);
  }
  if (expression.kind === "call") expression.arguments.forEach((argument) => expressionSymbols(argument, symbols));
  if (expression.kind === "sparseMatrix") expression.entries.forEach(({ value }) => expressionSymbols(value, symbols));
  return symbols;
}

/** A self-contained Wolfram Language worksheet for one materialized K-matrix. */
export function solutionWolframScript(
  record: DiagramRecord,
  solution: Solution,
  ambient: Catalogue["ambient"],
): string {
  const dimension = solution.matrix.dimensions[0];
  const parameterRules = Object.entries(solution.parameters)
    .map(([name, value]) => `${wolframSymbol(name)} -> ${expressionToWolfram(value)}`);
  const numericValues: Record<string, string> = { q: "13/10", λ: "7/5", μ: "11/10" };
  const numericSymbols = Array.from(expressionSymbols(ambient.rMatrix.matrix,
    expressionSymbols(solution.matrix))).filter((name) => !["u", "v", "I"].includes(name));
  const numericRules = numericSymbols.map((name, index) =>
    `${wolframSymbol(name)} -> ${numericValues[name] ?? `${17 + index}/10`}`);
  const standardResidual = [
    "R21[u/v].K1[u].R[u v].K2[v] -",
    "  K2[v].R21[u v].K1[u].R[u/v]",
  ].join("\n");
  const transposedResidual = [
    "R[u/v].K1[u].PartialTransposeFirst[R[1/(u v)]].K2[v] -",
    "  K2[v].PartialTransposeFirst[R[1/(u v)]].K1[u].R[u/v]",
  ].join("\n");
  const residual = record.reflectionEquation.kind === "Transposed" ? transposedResidual : standardResidual;

  return [
    `(* QRE K-matrix workbench · ${solution.family} · ${record.id} *)`,
    `(* Generated from engine-backed sparse expressions; equation convention: ${record.reflectionEquation.kind}. *)`,
    "ClearAll[u, v, q, λ, μ, K, R, R21, K1, K2, ReflectionResidual];",
    `diagram = <|"AffineType" -> ${JSON.stringify(record.spec.affineType)}, "Rank" -> ${record.spec.rank}, ` +
      `"X" -> {${record.spec.X.join(", ")}}, "Tau" -> {${record.spec.tau.join(", ")}}|>;`,
    `familyParameters = {${parameterRules.join(", ")}};`,
    `dimension = ${dimension};`,
    `kTemplate = ${sparseMatrixToWolfram(solution.matrix)};`,
    `rTemplate = ${sparseMatrixToWolfram(ambient.rMatrix.matrix)};`,
    "K[x_] := kTemplate /. u -> x;",
    "R[x_] := rTemplate /. u -> x;",
    "permutation = SparseArray[Flatten[Table[{(i - 1) dimension + j, (j - 1) dimension + i} -> 1,",
    "  {i, dimension}, {j, dimension}]], {dimension^2, dimension^2}];",
    "R21[x_] := permutation.R[x].permutation;",
    "K1[x_] := KroneckerProduct[K[x], IdentityMatrix[dimension]];",
    "K2[x_] := KroneckerProduct[IdentityMatrix[dimension], K[x]];",
    "PartialTransposeFirst[m_] := SparseArray@ArrayReshape[",
    "  Transpose[ArrayReshape[Normal[m], {dimension, dimension, dimension, dimension}], {3, 2, 1, 4}],",
    "  {dimension^2, dimension^2}];",
    `ReflectionResidual[u_, v_] := ${residual};`,
    "",
    "(* Reproducible generic numerical check, away from the visible denominator loci. *)",
    `sampleRules = {${numericRules.join(", ")}};`,
    "numericResidual = N[Normal[ReflectionResidual[7/6, 5/4] /. sampleRules], 50];",
    "verification = <|",
    `  "Equation" -> ${JSON.stringify(record.reflectionEquation.kind)},`,
    "  \"SampleRules\" -> sampleRules,",
    "  \"MaximumResidual\" -> Max[Abs[Flatten[numericResidual]]],",
    "  \"Verified\" -> Max[Abs[Flatten[numericResidual]]] < 10^-35",
    "|>;",
    "verification",
    "",
  ].join("\n");
}

export function solutionWolframNotebook(
  record: DiagramRecord,
  solution: Solution,
  ambient: Catalogue["ambient"],
): string {
  const code = solutionWolframScript(record, solution, ambient)
    .replaceAll("\\", "\\\\").replaceAll('"', '\\"').replaceAll("\n", "\\n");
  return `Notebook[{\n` +
    ` Cell["${solution.family}: explicit K-matrix and reflection-equation verification", "Title"],\n` +
    ` Cell["Generated by the QRE K-matrix workbench. Evaluate the input cell to reconstruct K, R and the numerical residual.", "Text"],\n` +
    ` Cell[BoxData["${code}"], "Input"]\n` +
    `}, WindowTitle -> "${solution.family} · ${record.id}", StyleDefinitions -> "Default.nb"]\n`;
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
