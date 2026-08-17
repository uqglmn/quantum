export type Expression =
  | { kind: "integer"; value: string }
  | { kind: "rational"; numerator: string; denominator: string }
  | { kind: "real"; value: string; precision?: number | null }
  | { kind: "complex"; real: Expression; imaginary: Expression }
  | { kind: "symbol"; name: string }
  | { kind: "string"; value: string }
  | { kind: "call"; head: string; arguments: Expression[] }
  | SparseMatrix;

export interface SparseMatrix {
  kind: "sparseMatrix";
  dimensions: [number, number];
  indexBase: 0;
  entries: Array<{ index: [number, number]; value: Expression }>;
}

export interface CatalogueManifest {
  schemaVersion: string;
  engine: { name: "QREKMatrices"; version: string };
  files: Array<{
    id: string;
    affineType: string;
    rank: number;
    path: string;
    diagramCount: number;
    families: string[];
  }>;
}

export interface FamilySourceAnchor {
  source: string;
  anchor: string;
  role: string;
}

export interface FamilyFormulaRecord {
  kind: string;
  status: "published" | "computational" | "pending";
  latex: string;
  expression: Expression;
  definitions: Array<{
    definitionId: string;
    label: string;
    latex: string;
    expression: Expression;
  }>;
  assumptionsLatex: string;
  sourceAnchors: FamilySourceAnchor[];
}

export interface FamilyRecord {
  familyId: string;
  title: string;
  affineTypes: string[];
  description: string;
  contentStatus: string;
  regimes: string[];
  parameterOrder: string[];
  parameterDomain: {
    parameters: Array<{ name: string; label: string; type: "integer" }>;
    constraints: Array<{ constraintId: string; kind: string; latex: string }>;
    branches: Array<{
      branchId: string;
      label: string;
      regime: string;
      constraintsLatex: string[];
    }>;
  };
  generalFormula: FamilyFormulaRecord | null;
  properties: Array<{ kind: string; status: string; latex: string }>;
  sourceAnchors: FamilySourceAnchor[];
  instanceIds: string[];
}

export interface FamilyMembership {
  familyId: string;
  membershipStatus: "classified" | "candidate";
  regime: string;
  parameters: Record<string, Expression>;
  representative: boolean;
  transportPermutation: number[] | null;
}

export interface Solution {
  solutionId: string;
  family: string;
  equation: string;
  realization: "bare" | "dressed" | "transported";
  transformations: Array<{
    kind: "dress" | "transport" | "normalize" | "scalar";
    parameters: Record<string, Expression>;
  }>;
  basisLabels: Array<string | number>;
  parameters: Record<string, Expression>;
  matrix: SparseMatrix;
  latex: string;
  provenance: Record<string, unknown>;
  properties?: Array<Record<string, unknown>>;
  reflectionEquationCertificate: ReflectionEquationCertificate | null;
}

export interface ReflectionEquationCertificate {
  certificateId: string;
  status: "verified" | "failed" | "inconclusive";
  level: "exactSymbolic" | "exactSample" | "numericSample";
  method: string;
  equation: "Standard" | "Transposed";
  residualDimensions: [number, number];
  residualNonzeroCount: number;
  assumptions: string[];
  conventions: {
    spectralParameters: "multiplicative";
    kVariable: string;
    secondVariable: string;
    quantumParameter: string;
    tensorBasis: "lexicographic";
    partialTranspose: string | null;
  };
  engine: { name: "QREKMatrices"; version: string };
  provenance: Record<string, unknown>;
}

export interface QSPPresentation {
  qspId: string;
  status: "instantiatedPresentation";
  nameLatex: string;
  ambientAlgebraLatex: string;
  indexSets: {
    nodes: number[];
    levi: number[];
    boundary: number[];
    torusOrbitRepresentatives: number[];
  };
  theta: {
    kind: "KolbQuantumInvolution";
    longestParabolicWord: number[];
    latex: string;
  };
  generatorGroups: Array<{
    kind: "positiveLevi" | "thetaFixedTorus" | "boundary";
    nodes: number[];
    latex: string;
  }>;
  presentationLatex: string;
  parameters: { cNodes: number[]; sNodes: number[]; latex: string };
  relationStatus: "generatorPresentation";
  provenance: Record<string, unknown>;
}

export interface RepresentationRecord {
  representationId: string;
  kind: "vectorEvaluation";
  dimension: number;
  basisLabels: Array<string | number>;
  spectralParameter: string;
  quantumParameter: string;
  tensorBasisConvention: "lexicographic";
}

export interface RMatrixRecord {
  rMatrixId: string;
  status: "materialized";
  formulaKind: "untwistedTypeA" | "untwistedBCD" | "twistedLinear" | "twistedQuadratic";
  dimension: number;
  latex: string;
  operatorDefinitions: Array<{ symbol: string; latex: string }>;
  matrix: SparseMatrix;
  matrixParameters: string[];
  crossingParameterSquared: Expression | null;
  normalizationLatex: string;
  properties: Array<{
    kind: "regularity" | "unitarity" | "yangBaxter";
    status: "sourceIdentity" | "verifiedExact" | "verifiedExactSample";
    latex: string;
  }>;
  provenance: Record<string, unknown>;
}

export interface ReflectionEquationRecord {
  kind: "Standard" | "Transposed";
  status: "instantiatedIdentity";
  latex: string;
  rMatrixId: string;
  verification: {
    status: "notComputed" | "verified" | "failed" | "conditional";
    method: string | null;
    certificateIds: string[];
  };
  conventions: {
    spectralParameters: "multiplicative";
    legNumbering: "12/21";
    partialTranspose: string | null;
  };
}

export interface DiagramRecord {
  id: string;
  spec: {
    affineType: string;
    rank: number;
    nodes: number[];
    X: number[];
    tau: number[];
  };
  data: {
    cartanMatrix: number[][];
    symmetrizers: Expression[];
  };
  classification: {
    status: string;
    family: string | null;
    candidateFamilies: string[];
    regime: string;
    equation: string;
    parameters: Record<string, Expression>;
    representativeFamily?: string | null;
    representativePermutation?: number[] | null;
  };
  familyMemberships: FamilyMembership[];
  qsp: QSPPresentation;
  reflectionEquation: ReflectionEquationRecord;
  capabilities: {
    qspAlgebra: boolean;
    kMatrix: boolean;
    rMatrix: boolean;
    properties: string[];
    remoteComputation: boolean;
  };
  computation: {
    status: string;
    solution: Solution | null;
    candidates: Solution[];
  };
}

export interface Catalogue {
  schemaVersion: string;
  engine: { name: "QREKMatrices"; version: string };
  catalogue: { id: string; affineType: string; rank: number };
  ambient: { representation: RepresentationRecord; rMatrix: RMatrixRecord };
  families: FamilyRecord[];
  summary: { diagramCount: number; statuses: Record<string, number> };
  diagrams: DiagramRecord[];
}

export type Realization = "bare" | "dressed" | "transported";
