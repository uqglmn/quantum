import type { FamilyDefinition } from "../lib/families";
import { MathFormula } from "./MathFormula";

export function FamilyFormula({ family, regime }: { family: FamilyDefinition; regime: string }) {
  const formula = family.regimeFormulas?.find((candidate) => candidate.regime === regime)?.formula ?? family.formula;
  if (!formula) return <section className="family-formula family-formula--pending">
    <div className="section-kicker">Family formula</div>
    <h3>Computational record in progress</h3>
    <p>The family is available for diagram and QSP exploration, but a theorem-level formula has not yet been registered from the unfinished twisted-affine computations. Any concrete matrix below is labelled by its own computation status.</p>
  </section>;

  return <section className="family-formula">
    <div className="family-formula-heading">
      <div><div className="section-kicker">Family formula</div><h3>The general {family.id} solution</h3></div>
      <span className="formula-source">{formula.source}</span>
    </div>
    <div className="family-master-formula"><MathFormula latex={formula.latex} label={`${family.id} general K-matrix formula`} /></div>
    {regime.toLowerCase() === "nonquasistandard" && family.regimeFormulas?.some((candidate) => candidate.regime === regime) && <div className="formula-regime-notice">
      The selected diagram uses the separate non-quasistandard family law and its additional parameter ν. The quasistandard formula is recovered at ν² = −1.
    </div>}
    {formula.definitions.length > 0 && <div className="family-definitions">
      {formula.definitions.map((definition) => <details key={definition.label} open={family.id === "C.1"}>
        <summary>{definition.label}</summary>
        <MathFormula latex={definition.latex} />
      </details>)}
    </div>}
    <div className="formula-assumptions"><span>Parameter domain</span><MathFormula latex={formula.assumptions} display={false} /></div>
    {family.parameterDomain && family.parameterDomain.branches.length > 0 && <div className="family-branches">
      <span>Classification branches</span>
      <div>{family.parameterDomain.branches.map((branch) => <article key={branch.branchId}>
        <strong>{branch.label}</strong><small>{branch.regime}</small>
        {branch.constraintsLatex.map((constraint) => <MathFormula key={constraint} latex={constraint} display={false} />)}
      </article>)}</div>
    </div>}
  </section>;
}
