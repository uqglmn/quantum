/**
 * The nine affine presentation blocks over seven Kac series.
 *
 * Terminology follows notes/working-version/qRE_v2/CONVENTIONS.md: reversing a
 * twisted type-A presentation is called *reversed*, never *transposed*. The
 * transposed reflection equation is an unrelated notion, and the leading "t"
 * in tB*.1 / tC**.1 denotes the reversed presentation.
 */
export interface Presentation {
  id: string;
  affineType: string;
  kacLatex: string;
  reversed: boolean;
  twisted: boolean;
  vectorDimension: string;
}

export const PRESENTATIONS: Presentation[] = [
  { id: "U-A", affineType: "A(1)", kacLatex: String.raw`A_n^{(1)}`, reversed: false, twisted: false, vectorDimension: "n+1" },
  { id: "U-B", affineType: "B(1)", kacLatex: String.raw`B_n^{(1)}`, reversed: false, twisted: false, vectorDimension: "2n+1" },
  { id: "U-C", affineType: "C(1)", kacLatex: String.raw`C_n^{(1)}`, reversed: false, twisted: false, vectorDimension: "2n" },
  { id: "U-D", affineType: "D(1)", kacLatex: String.raw`D_n^{(1)}`, reversed: false, twisted: false, vectorDimension: "2n" },
  { id: "T-Ao", affineType: "A2n-1(2)", kacLatex: String.raw`A_{2n-1}^{(2)}`, reversed: false, twisted: true, vectorDimension: "2n" },
  { id: "T-AoR", affineType: "A2n-1(2)T", kacLatex: String.raw`A_{2n-1}^{(2)}`, reversed: true, twisted: true, vectorDimension: "2n" },
  { id: "T-Ae", affineType: "A2n(2)", kacLatex: String.raw`A_{2n}^{(2)}`, reversed: false, twisted: true, vectorDimension: "2n+1" },
  { id: "T-AeR", affineType: "A2n(2)T", kacLatex: String.raw`A_{2n}^{(2)}`, reversed: true, twisted: true, vectorDimension: "2n+1" },
  { id: "T-D", affineType: "Dn+1(2)", kacLatex: String.raw`D_{n+1}^{(2)}`, reversed: false, twisted: true, vectorDimension: "2n+2" },
];

const BY_TYPE = new Map(PRESENTATIONS.map((p) => [p.affineType, p]));

export function presentationFor(affineType: string): Presentation | undefined {
  return BY_TYPE.get(affineType);
}

/** Display name of a presentation, e.g. "A_{2n-1}^{(2)}, reversed". */
export function presentationLatex(affineType: string): string {
  const presentation = BY_TYPE.get(affineType);
  if (!presentation) return affineType;
  return presentation.reversed
    ? `${presentation.kacLatex}\\ \\text{reversed}`
    : presentation.kacLatex;
}

export function morphologyOf(familyId: string): string {
  const suffix = familyId.slice(familyId.lastIndexOf(".") + 1);
  if (suffix === "1") return "plain";
  if (suffix === "2") return "alternating";
  if (suffix === "3") return "cyclic";
  if (suffix === "4") return "parallel";
  return "";
}
