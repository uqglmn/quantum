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
  }>;
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
  summary: { diagramCount: number; statuses: Record<string, number> };
  diagrams: DiagramRecord[];
}

export type Realization = "bare" | "dressed" | "nonstandard";
