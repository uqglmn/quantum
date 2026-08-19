import { useEffect, useState } from "react";
import type { Catalogue, ManifestFamilyRecord } from "../domain";
import { MathFormula } from "./MathFormula";
import { SatakeSchematic } from "./SatakeSchematic";
import { InstanceExplorer } from "./InstanceExplorer";
import { RMatrixView } from "./InstancePanels";
import { morphologyOf, presentationFor, presentationLatex } from "../lib/presentations";

function Disclosure({ title, hint, children, open = false }: {
  title: string; hint?: string; children: React.ReactNode; open?: boolean;
}) {
  return <details className="disclosure" open={open}>
    <summary>{title}{hint && <span className="disclosure-hint">{hint}</span>}</summary>
    <div className="disclosure-body">{children}</div>
  </details>;
}

function Legend() {
  return <div className="legend-bar">
    <span className="legend"><svg width="13" height="13" viewBox="0 0 13 13" aria-hidden="true">
      <circle className="dg-node dg-node--filled" cx="6.5" cy="6.5" r="5" /></svg> node in X</span>
    <span className="legend"><svg width="13" height="13" viewBox="0 0 13 13" aria-hidden="true">
      <circle className="dg-node dg-node--open" cx="6.5" cy="6.5" r="5" /></svg> node not in X</span>
    <span className="legend"><svg width="28" height="13" viewBox="0 0 28 13" aria-hidden="true">
      <line className="dg-edge dg-edge--dashed" x1="1" y1="6.5" x2="27" y2="6.5" /></svg> run of arbitrary length</span>
    <span className="legend legend--tau"><svg width="28" height="13" viewBox="0 0 28 13" aria-hidden="true">
      <line className="dg-tau" x1="3" y1="6.5" x2="25" y2="6.5" /></svg> τ-orbit</span>
    <span className="rank-note">arbitrary rank n</span>
  </div>;
}

export function FamilyPage({ family, engineVersion }: {
  family: ManifestFamilyRecord;
  engineVersion: string;
}) {
  const [variantIndex, setVariantIndex] = useState(0);
  useEffect(() => { setVariantIndex(0); }, [family.familyId]);

  const affineType = family.affineTypes[0];
  const presentation = presentationFor(affineType);
  const variants = family.schematic ?? [];
  const variant = variants[Math.min(variantIndex, variants.length - 1)];
  const formula = family.generalFormula;
  const morphology = morphologyOf(family.familyId);

  return <main className="family-page">
    <div className="eyebrow">
      {presentation && <span className="pres-badge">{presentation.id}</span>}
      <MathFormula latex={presentationLatex(affineType)} display={false} />
      {morphology && <><span className="dot" aria-hidden="true" />{morphology}</>}
      {presentation?.twisted && <><span className="dot" aria-hidden="true" />twisted</>}
    </div>

    <h1>{family.title}</h1>
    <p className="lede">{family.description}</p>

    {variants.length > 1 && <div className="variant-strip" role="tablist" aria-label="Representative diagrams">
      {variants.map((entry, index) => <button key={entry.variantId} role="tab"
        aria-selected={index === variantIndex}
        className={`variant-btn${index === variantIndex ? " is-active" : ""}`}
        onClick={() => setVariantIndex(index)}>
        <span className="variant-id">{entry.variantId}</span>{entry.label}
      </button>)}
    </div>}

    {variant ? <figure className="sheet">
      <div className="sheet-body"><SatakeSchematic variant={variant}
        description={`${family.familyId} generalized Satake diagram, ${variant.label}`} /></div>
      <figcaption><Legend /></figcaption>
    </figure> : <div className="sheet sheet--empty">
      <p>No arbitrary-rank schematic is registered for this family.</p>
    </div>}

    {family.parameterDomain.constraints.length > 0 && <div className="chips">
      {family.parameterDomain.constraints.map((constraint) => <span className="chip" key={constraint.constraintId}>
        <MathFormula latex={constraint.latex} display={false} />
      </span>)}
    </div>}

    <section className="section">
      <div className="section-head">
        <h2>The K-matrix</h2>
        <span className="section-note">{family.contentStatus === "published" ? "bare solution" : family.contentStatus}</span>
      </div>
      {formula ? <>
        <div className="formula-sheet"><MathFormula latex={formula.latex} label={`${family.familyId} K-matrix`} /></div>
        {formula.definitions.length > 0 && <div className="definitions">
          {formula.definitions.map((definition, index) => <div className="definition" key={index}>
            {definition.label && <span className="definition-key">{definition.label}</span>}
            <MathFormula latex={definition.latex} />
          </div>)}
        </div>}
        {formula.assumptionsLatex && <p className="assumption">
          <span>valid for</span><MathFormula latex={formula.assumptionsLatex} display={false} />
        </p>}
      </> : <p className="muted-note">No closed formula has been migrated for this family yet.</p>}
    </section>

    {family.parameterDomain.branches.length > 0 && <section className="section">
      <div className="section-head"><h2>Cases</h2>
        <span className="section-note">{family.parameterDomain.branches.length}{" "}
          {family.parameterDomain.branches.length === 1 ? "stratum" : "strata"}</span></div>
      <div className="branch-table">
        {family.parameterDomain.branches.map((branch) => <article className="branch" key={branch.branchId}>
          <div className="branch-head">
            <strong>{branch.label}</strong>
            <code>{branch.branchId}</code>
            <span className={`pill pill--${branch.regime === "NonQuasistandard" ? "warn" : "neutral"}`}>
              {branch.regime === "NonQuasistandard" ? "non-quasistandard" : "main catalogue"}
            </span>
          </div>
          <div className="branch-constraints">
            {branch.constraintsLatex.map((latex, index) => <span className="chip chip--sm" key={index}>
              <MathFormula latex={latex} display={false} />
            </span>)}
          </div>
        </article>)}
      </div>
    </section>}

    <Disclosure title="See it at a concrete rank"
      hint={`${family.catalogues.length} exported ranks`}>
      <InstanceExplorer family={family} />
    </Disclosure>

    <Disclosure title="Construction and verification"
      hint="properties · provenance · engine">
      {family.properties.length > 0 && <div className="definitions">
        {family.properties.map((property, index) => <div className="definition" key={index}>
          <span className="definition-key">{property.kind}</span>
          <MathFormula latex={property.latex} />
          <span className={`pill pill--${property.status === "verified" || property.status === "computedExact" ? "good" : "neutral"}`}>
            {property.status}
          </span>
        </div>)}
      </div>}
      <dl className="kv">
        <div><dt>regimes</dt><dd>{family.regimes.join(", ") || "—"}</dd></div>
        <div><dt>parameters</dt><dd>{family.parameterOrder.join(", ") || "none"}</dd></div>
        <div><dt>presentation</dt><dd>{presentation
          ? `${presentation.id} · vector dimension N = ${presentation.vectorDimension}${presentation.reversed ? " · reversed presentation" : ""}`
          : affineType}</dd></div>
        <div><dt>source</dt><dd>{family.sourceAnchors.length
          ? family.sourceAnchors.map((anchor, index) => <code key={index}>
              {anchor.source}{anchor.anchor ? ` — ${anchor.anchor}` : ""}
            </code>)
          : "—"}</dd></div>
        <div><dt>engine</dt><dd><code>QREKMatrices {engineVersion}</code></dd></div>
      </dl>
      <p className="muted-note">
        Diagram schematics are exported by the package as layout-free token streams; this page
        derives all coordinates. A dashed run denotes a block of arbitrary admissible length.
      </p>
    </Disclosure>
  </main>;
}

/** Ambient R-matrix panel, shown once per presentation rather than per family. */
export function AmbientPanel({ ambient }: { ambient: Catalogue["ambient"] }) {
  return <RMatrixView ambient={ambient} />;
}
