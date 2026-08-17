import type { DiagramRecord, FamilyRecord } from "../domain";
import { formatExpression } from "./expression";

export type FamilyStatus = "published" | "computational";

export interface FamilyFormulaDefinition {
  latex: string;
  definitions: Array<{ label: string; latex: string }>;
  assumptions: string;
  source: string;
}

export interface FamilyDefinition {
  id: string;
  affineTypes: string[];
  title: string;
  description: string;
  status: FamilyStatus;
  parameterOrder: string[];
  parameterDomain?: FamilyRecord["parameterDomain"];
  formula?: FamilyFormulaDefinition;
  regimeFormulas?: Array<{ regime: string; formula: FamilyFormulaDefinition }>;
}

const masterFormula: FamilyFormulaDefinition = {
  latex: String.raw`K(u)=\operatorname{Id}+\frac{u-u^{-1}}{k_1(u)}\left(M_1(u)+\frac{M_2(u)}{k_2(u)}\right)`,
  definitions: [
    { label: "First denominator", latex: String.raw`k_1(u)=\lambda\mu-u` },
    { label: "Family terms", latex: String.raw`M_1(u),\ M_2(u)\ \text{are specialised by the selected family and }(\ell,r,t)` },
  ],
  assumptions: String.raw`q,u,\lambda,\mu\ \text{generic; denominators nonzero}`,
  source: "qRE/files/results.tex, Theorem T:all-K",
};

const c1Formula: FamilyFormulaDefinition = {
  latex: masterFormula.latex,
  definitions: [
    { label: "Denominators", latex: String.raw`k_1(u)=\lambda\mu-u,\qquad k_2(u)=\lambda^{-1}-(\mu u)^{-1}` },
    { label: "Diagonal term", latex: String.raw`M_1(u)=\sum_{\bar\ell\leq i\leq n}\left(\lambda\mu uE_{-i,-i}+E_{ii}\right)` },
    { label: "Off-diagonal term", latex: String.raw`M_2(u)=\sum_{\bar r\leq i<\bar\ell}\left(-\lambda E_{-i,-i}+\lambda^{-1}E_{ii}+E_{-i,i}-E_{i,-i}\right)` },
    { label: "Parameters", latex: String.raw`\lambda=q^{\bar r},\quad \mu=q^{-\ell-1};\qquad \mu\in\mathbb K^\times\ (\ell=0),\quad \lambda\in\mathbb K^\times\ (r=n)` },
  ],
  assumptions: String.raw`0\leq\ell\leq r\leq n-\ell,\qquad r\neq\ell+2\ \text{in the quasistandard regime}`,
  source: "qRE/files/resultsC1BD2.tex, Result Res:C1",
};

const definitions: FamilyDefinition[] = [
  { id: "A.1", affineTypes: ["A(1)"], title: "A.1", description: "Identity family for untwisted affine type A.", status: "published", parameterOrder: [], formula: { latex: String.raw`K(u)=\operatorname{Id}`, definitions: [], assumptions: String.raw`N>2`, source: "qRE/files/results.tex, Theorem T:all-K" } },
  { id: "A.2", affineTypes: ["A(1)"], title: "A.2", description: "Constant symplectic block family in even dimension.", status: "published", parameterOrder: [], formula: { latex: String.raw`K(u)=\sum_{1\leq i\leq N/2}\left(q^{1/2}E_{2i-1,2i}-q^{-1/2}E_{2i,2i-1}\right)`, definitions: [], assumptions: String.raw`N>2\ \text{even}`, source: "qRE/files/results.tex, Theorem T:all-K" } },
  { id: "A.3", affineTypes: ["A(1)"], title: "A.3", description: "Parametric cyclic family, including the affine-node position t.", status: "published", parameterOrder: ["l", "r", "t"], formula: masterFormula },
  { id: "A.4", affineTypes: ["A(1)"], title: "A.4", description: "Half-period exchange family in even dimension.", status: "published", parameterOrder: [], formula: { latex: String.raw`K(u)=\sum_{1\leq i\leq N/2}\left(uE_{i+N/2,i}+E_{i,i+N/2}\right)`, definitions: [], assumptions: String.raw`N>2\ \text{even}`, source: "qRE/files/results.tex, Theorem T:all-K" } },
  { id: "B.1", affineTypes: ["B(1)"], title: "B.1", description: "Untwisted B member of the BD.1 master family.", status: "published", parameterOrder: ["l", "r"], formula: masterFormula },
  { id: "B.2", affineTypes: ["B(1)"], title: "B.2", description: "Untwisted B member of the BD.2 alternating family.", status: "published", parameterOrder: ["l", "r"], formula: masterFormula },
  { id: "C.1", affineTypes: ["C(1)"], title: "C.1", description: "Identity-involution family parametrised by the distinguished nodes ℓ and r.", status: "published", parameterOrder: ["l", "r"], formula: c1Formula },
  { id: "C.2", affineTypes: ["C(1)"], title: "C.2", description: "Alternating untwisted C family.", status: "published", parameterOrder: ["l", "r"], formula: masterFormula },
  { id: "C.4", affineTypes: ["C(1)"], title: "C.4", description: "Involutive untwisted C family.", status: "published", parameterOrder: ["l"], formula: masterFormula },
  { id: "D.1", affineTypes: ["D(1)"], title: "D.1", description: "Untwisted D member of the BD.1 master family.", status: "published", parameterOrder: ["l", "r"], formula: masterFormula },
  { id: "D.2", affineTypes: ["D(1)"], title: "D.2", description: "Untwisted D member of the BD.2 alternating family.", status: "published", parameterOrder: ["l", "r"], formula: masterFormula },
  { id: "D.3", affineTypes: ["D(1)"], title: "D.3", description: "Exceptional rank-four family: the vector intertwining problem has only the zero solution.", status: "published", parameterOrder: [], formula: { latex: String.raw`K(u)=0`, definitions: [], assumptions: String.raw`n=4,\quad \tau\in[(1\ 4)]`, source: "qRE/files/results.tex and qRE/files/lowrank.tex" } },
  { id: "D.4", affineTypes: ["D(1)"], title: "D.4", description: "Fork-sensitive CD.4 family with a special ℓ=1 formula.", status: "published", parameterOrder: ["l"], formula: masterFormula },
  { id: "B*.1", affineTypes: ["A2n-1(2)"], title: "B*.1", description: "Twisted affine A family in the standard reflection-equation presentation.", status: "computational", parameterOrder: ["l", "r"] },
  { id: "B*.2", affineTypes: ["A2n-1(2)"], title: "B*.2", description: "Alternating twisted affine A family.", status: "computational", parameterOrder: ["l", "r"] },
  { id: "tB*.1", affineTypes: ["A2n-1(2)T"], title: "tB*.1", description: "Transposed-equation presentation of the twisted B*.1 family.", status: "computational", parameterOrder: ["l", "r"] },
  { id: "tB*.2", affineTypes: ["A2n-1(2)T"], title: "tB*.2", description: "Transposed-equation presentation of the twisted B*.2 family.", status: "computational", parameterOrder: ["l", "r"] },
  { id: "C**.1", affineTypes: ["A2n(2)"], title: "C**.1", description: "Twisted affine A family of quadratic evaluation type.", status: "computational", parameterOrder: ["l", "r"] },
  { id: "C**.2", affineTypes: ["A2n(2)"], title: "C**.2", description: "Alternating twisted affine A family of quadratic evaluation type.", status: "computational", parameterOrder: ["l", "r"] },
  { id: "tC**.1", affineTypes: ["A2n(2)T"], title: "tC**.1", description: "Transposed-equation presentation of C**.1.", status: "computational", parameterOrder: ["l", "r"] },
  { id: "tC**.2", affineTypes: ["A2n(2)T"], title: "tC**.2", description: "Transposed-equation presentation of C**.2.", status: "computational", parameterOrder: ["l", "r"] },
  { id: "C*.1", affineTypes: ["Dn+1(2)"], title: "C*.1", description: "Twisted affine D family.", status: "computational", parameterOrder: ["l", "r"] },
  { id: "C*.2", affineTypes: ["Dn+1(2)"], title: "C*.2", description: "Alternating twisted affine D family.", status: "computational", parameterOrder: ["l", "r"] },
  { id: "C*.4", affineTypes: ["Dn+1(2)"], title: "C*.4", description: "Involutive twisted affine D family.", status: "computational", parameterOrder: ["l"] },
];

export const familyDefinitions = definitions;

function exportedFamilyDefinition(record: FamilyRecord): FamilyDefinition {
  const firstSource = record.generalFormula?.sourceAnchors[0] ?? record.sourceAnchors[0];
  return {
    id: record.familyId,
    affineTypes: record.affineTypes,
    title: record.title,
    description: record.description,
    status: record.contentStatus === "published" ? "published" : "computational",
    parameterOrder: record.parameterOrder,
    parameterDomain: record.parameterDomain,
    regimeFormulas: (record.regimeFormulas ?? []).map(({ regime, formula }) => ({
      regime,
      formula: {
        latex: formula.latex,
        definitions: formula.definitions.map(({ label, latex }) => ({ label, latex })),
        assumptions: formula.assumptionsLatex,
        source: formula.sourceAnchors[0]
          ? `${formula.sourceAnchors[0].source}${formula.sourceAnchors[0].anchor ? `, ${formula.sourceAnchors[0].anchor}` : ""}`
          : "Exported regime formula",
      },
    })),
    formula: record.generalFormula ? {
      latex: record.generalFormula.latex,
      definitions: record.generalFormula.definitions.map(({ label, latex }) => ({ label, latex })),
      assumptions: record.generalFormula.assumptionsLatex,
      source: firstSource ? `${firstSource.source}${firstSource.anchor ? `, ${firstSource.anchor}` : ""}` : "Exported family record",
    } : undefined,
  };
}

export function familyDefinition(id: string | null | undefined, exported: FamilyRecord[] = []): FamilyDefinition | undefined {
  const record = exported.find((candidate) => candidate.familyId === id);
  return record ? exportedFamilyDefinition(record) : definitions.find((definition) => definition.id === id);
}

export function familiesForAffineType(affineType: string): FamilyDefinition[] {
  return definitions.filter((definition) => definition.affineTypes.includes(affineType));
}

export function recordBelongsToFamily(record: DiagramRecord, familyId: string): boolean {
  return record.familyMemberships?.some((membership) => membership.familyId === familyId)
    ?? (record.classification.family === familyId || record.classification.candidateFamilies.includes(familyId));
}

export function parameterValue(record: DiagramRecord, key: string): string | null {
  const value = record.classification.parameters[key];
  return value ? formatExpression(value) : null;
}

export function parameterLabel(key: string): string {
  return ({ l: "ℓ", r: "r", t: "t", p1: "p₁", p2: "p₂", o1: "o₁", o2: "o₂" } as Record<string, string>)[key] ?? key;
}

export function isTwistedAffineType(affineType: string): boolean {
  return affineType !== "A(1)" && affineType !== "B(1)" && affineType !== "C(1)" && affineType !== "D(1)";
}

export function affineTypeLatex(affineType: string): string {
  return ({
    "A(1)": String.raw`A_n^{(1)}`,
    "B(1)": String.raw`B_n^{(1)}`,
    "C(1)": String.raw`C_n^{(1)}`,
    "D(1)": String.raw`D_n^{(1)}`,
    "A2n-1(2)": String.raw`A_{2n-1}^{(2)}`,
    "A2n-1(2)T": String.raw`A_{2n-1}^{(2)}\ \text{(transposed)}`,
    "A2n(2)": String.raw`A_{2n}^{(2)}`,
    "A2n(2)T": String.raw`A_{2n}^{(2)}\ \text{(transposed)}`,
    "Dn+1(2)": String.raw`D_{n+1}^{(2)}`,
  } as Record<string, string>)[affineType] ?? affineType;
}
