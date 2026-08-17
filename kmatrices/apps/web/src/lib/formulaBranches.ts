import type { DiagramRecord, DiagramSummary } from "../domain";

type NavigableDiagram = DiagramRecord | DiagramSummary;

function integerParameter(record: NavigableDiagram, name: string): number | null {
  const expression = record.classification.parameters[name];
  if (!expression || expression.kind !== "integer") return null;
  const value = Number(expression.value);
  return Number.isInteger(value) ? value : null;
}

export function formulaBranchId(record: NavigableDiagram, familyId: string): string | null {
  const exported = record.familyMemberships.find(({ familyId: candidate }) => candidate === familyId)?.formulaBranchId;
  if (exported) return exported;
  if (familyId !== "A.3") return null;
  const ell = integerParameter(record, "l");
  const r = integerParameter(record, "r");
  const t = integerParameter(record, "t");
  if (ell === null || r === null || t === null) return null;
  const maximum = Math.floor(t / 2);
  if (ell > 0 && r < maximum) return "interior";
  if (ell === 0 && r < maximum) return "left-boundary";
  if (ell > 0 && r === maximum) return "right-boundary";
  if (ell === 0 && r === maximum) return "corner";
  return null;
}
