import type { FamilyDefinition } from "../lib/families";
import { MathFormula } from "./MathFormula";

export function FamilyFormula({ family, regime }: { family: FamilyDefinition; regime: string }) {
  if (!family.formula) return <section className="family-formula family-formula--pending">
    <div className="section-kicker">Family formula</div>
    <h3>Computational record in progress</h3>
    <p>The family is available for diagram and QSP exploration, but a theorem-level formula has not yet been registered from the unfinished twisted-affine computations. Any concrete matrix below is labelled by its own computation status.</p>
  </section>;

  return <section className="family-formula">
    <div className="family-formula-heading">
      <div><div className="section-kicker">Family formula</div><h3>The general {family.id} solution</h3></div>
      <span className="formula-source">{family.formula.source}</span>
    </div>
    <div className="family-master-formula"><MathFormula latex={family.formula.latex} label={`${family.id} general K-matrix formula`} /></div>
    {regime.toLowerCase() === "nonquasistandard" && <div className="formula-regime-notice">
      The selected diagram lies in the non-quasistandard branch. The formula displayed here is the quasistandard family law; use the explicit artifact below for this instance while the exceptional family formula is registered separately.
    </div>}
    {family.formula.definitions.length > 0 && <div className="family-definitions">
      {family.formula.definitions.map((definition) => <details key={definition.label} open={family.id === "C.1"}>
        <summary>{definition.label}</summary>
        <MathFormula latex={definition.latex} />
      </details>)}
    </div>}
    <div className="formula-assumptions"><span>Parameter domain</span><MathFormula latex={family.formula.assumptions} display={false} /></div>
  </section>;
}
