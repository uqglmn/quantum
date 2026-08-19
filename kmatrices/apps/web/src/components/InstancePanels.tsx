import { useEffect, useState } from "react";
import type { Catalogue, DiagramRecord, Realization, Solution } from "../domain";
import { MathFormula } from "./MathFormula";
import { expressionToLatex, formatExpression } from "../lib/expression";
import { buildSolutionBundle, downloadText, safeFilename, solutionLatexDocument } from "../lib/solutionExport";

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "good" | "warn" }) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

export function Availability({ available, children }: { available: boolean; children: React.ReactNode }) {
  return <span className={available ? "availability availability--yes" : "availability"}>
    <span aria-hidden="true">{available ? "●" : "○"}</span> {children}
  </span>;
}

export function MatrixView({ record, solution, engine, ambient }: {
  record: DiagramRecord;
  solution: Solution;
  engine: Catalogue["engine"];
  ambient: Catalogue["ambient"];
}) {
  const [view, setView] = useState<"rendered" | "sparse" | "latex" | "certificate" | "provenance">("rendered");
  const [copied, setCopied] = useState(false);
  useEffect(() => { setView("rendered"); setCopied(false); }, [solution.solutionId]);

  const stem = safeFilename(`${record.id}-${solution.family}`);
  const copyLatex = async () => {
    await navigator.clipboard.writeText(solution.latex);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };
  const downloadJson = () => downloadText(
    `${stem}.json`,
    JSON.stringify(buildSolutionBundle(record, solution, engine, ambient), null, 2),
    "application/json",
  );
  const downloadLatex = () => downloadText(
    `${stem}.tex`, solutionLatexDocument(record, solution, ambient), "text/x-tex",
  );

  return <div className="matrix-view">
    <div className="matrix-toolbar">
      <div className="subtabs">
        <button className={view === "rendered" ? "is-active" : ""} onClick={() => setView("rendered")}>Matrix</button>
        <button className={view === "sparse" ? "is-active" : ""} onClick={() => setView("sparse")}>Sparse entries</button>
        <button className={view === "latex" ? "is-active" : ""} onClick={() => setView("latex")}>LaTeX</button>
        <button className={view === "certificate" ? "is-active" : ""} onClick={() => setView("certificate")}>Certificate</button>
        <button className={view === "provenance" ? "is-active" : ""} onClick={() => setView("provenance")}>Provenance</button>
      </div>
      <div className="export-actions">
        <button onClick={downloadJson}>JSON ↓</button>
        <button onClick={downloadLatex}>TeX ↓</button>
      </div>
    </div>
    {view === "rendered" && <div className="rendered-matrix">
      <MathFormula latex={`K(u) = ${solution.latex}`} label={`${solution.family} K-matrix`} />
    </div>}
    {view === "sparse" && <div className="sparse-table" role="table">
      <div className="sparse-heading">{solution.matrix.dimensions.join(" × ")} · {solution.matrix.entries.length} nonzero entries · basis [{solution.basisLabels.join(", ")}]</div>
      {solution.matrix.entries.map((entry) => <div className="sparse-row" key={entry.index.join("-")}>
        <code>K<sub>{entry.index[0] + 1},{entry.index[1] + 1}</sub></code>
        <MathFormula latex={expressionToLatex(entry.value)} display={false} label={formatExpression(entry.value)} />
      </div>)}
    </div>}
    {view === "latex" && <div className="latex-pane">
      <button className="copy-button" onClick={copyLatex}>{copied ? "Copied" : "Copy LaTeX"}</button>
      <pre className="latex-source">{solution.latex}</pre>
    </div>}
    {view === "certificate" && (solution.reflectionEquationCertificate ? <div className="certificate-pane">
      <div className="certificate-summary">
        <Badge tone={solution.reflectionEquationCertificate.status === "verified" ? "good" : "warn"}>{solution.reflectionEquationCertificate.status}</Badge>
        <strong>{solution.reflectionEquationCertificate.level}</strong>
        <span>residual {solution.reflectionEquationCertificate.residualNonzeroCount} / {solution.reflectionEquationCertificate.residualDimensions.join(" × ")}</span>
      </div>
      <dl>
        <div><dt>Certificate ID</dt><dd><code>{solution.reflectionEquationCertificate.certificateId}</code></dd></div>
        <div><dt>Method</dt><dd>{solution.reflectionEquationCertificate.method}</dd></div>
        <div><dt>Equation</dt><dd>{solution.reflectionEquationCertificate.equation}</dd></div>
        <div><dt>Variables</dt><dd><code>{solution.reflectionEquationCertificate.conventions.kVariable}, {solution.reflectionEquationCertificate.conventions.secondVariable}; q = {solution.reflectionEquationCertificate.conventions.quantumParameter}</code></dd></div>
        <div><dt>Tensor convention</dt><dd>{solution.reflectionEquationCertificate.conventions.tensorBasis}; partial transpose {solution.reflectionEquationCertificate.conventions.partialTranspose ?? "none"}</dd></div>
        <div><dt>Assumptions</dt><dd>{solution.reflectionEquationCertificate.assumptions.join("; ")}</dd></div>
        <div><dt>Engine</dt><dd>{solution.reflectionEquationCertificate.engine.name} {solution.reflectionEquationCertificate.engine.version}</dd></div>
      </dl>
      <pre>{JSON.stringify(solution.reflectionEquationCertificate.provenance, null, 2)}</pre>
    </div> : <div className="empty-state">
      <strong>Verification not yet computed for this solution.</strong>
      <p>The certificate pipeline is being extended family by family. Absence of a certificate is not a failed reflection equation.</p>
    </div>)}
    {view === "provenance" && <div className="provenance-pane">
      <dl>
        <div><dt>Solution ID</dt><dd><code>{solution.solutionId}</code></dd></div>
        <div><dt>Engine</dt><dd>{engine.name} {engine.version}</dd></div>
        <div><dt>Realisation</dt><dd>{solution.realization}</dd></div>
        <div><dt>Transformation chain</dt><dd>{solution.transformations.length ? solution.transformations.map(({ kind }) => kind).join(" → ") : "none (bare)"}</dd></div>
      </dl>
      <pre>{JSON.stringify(solution.provenance, null, 2)}</pre>
    </div>}
  </div>;
}

export function RMatrixView({ ambient }: { ambient: Catalogue["ambient"] }) {
  const [view, setView] = useState<"formula" | "sparse" | "provenance">("formula");
  const matrix = ambient.rMatrix.matrix;
  const downloadMatrix = () => downloadText(
    `${safeFilename(ambient.rMatrix.rMatrixId)}.json`,
    JSON.stringify({
      rMatrixId: ambient.rMatrix.rMatrixId,
      representation: ambient.representation,
      parameters: ambient.rMatrix.matrixParameters,
      matrix,
      provenance: ambient.rMatrix.provenance,
    }, null, 2),
    "application/json",
  );
  return <div className="matrix-view">
    <div className="matrix-toolbar">
      <div className="subtabs">
        <button className={view === "formula" ? "is-active" : ""} onClick={() => setView("formula")}>Formula</button>
        <button className={view === "sparse" ? "is-active" : ""} onClick={() => setView("sparse")}>Sparse entries</button>
        <button className={view === "provenance" ? "is-active" : ""} onClick={() => setView("provenance")}>Provenance</button>
      </div>
      <div className="export-actions"><button onClick={downloadMatrix}>JSON ↓</button></div>
    </div>
    {view === "formula" && <div className="rendered-matrix">
      <MathFormula latex={ambient.rMatrix.latex} label="ambient R-matrix formula" />
    </div>}
    {view === "sparse" && <div className="sparse-table" role="table">
      <div className="sparse-heading">{matrix.dimensions.join(" × ")} · {matrix.entries.length} nonzero symbolic entries · parameters [{ambient.rMatrix.matrixParameters.join(", ")}]</div>
      {matrix.entries.map((entry) => <div className="sparse-row" key={entry.index.join("-")}>
        <code>R<sub>{entry.index[0] + 1},{entry.index[1] + 1}</sub></code>
        <MathFormula latex={expressionToLatex(entry.value)} display={false} label={formatExpression(entry.value)} />
      </div>)}
    </div>}
    {view === "provenance" && <div className="provenance-pane">
      <dl>
        <div><dt>R-matrix ID</dt><dd><code>{ambient.rMatrix.rMatrixId}</code></dd></div>
        <div><dt>Materialization</dt><dd>{String(ambient.rMatrix.provenance.MatrixMaterialization)}</dd></div>
        <div><dt>Tensor basis</dt><dd>{ambient.representation.tensorBasisConvention}</dd></div>
      </dl>
      <pre>{JSON.stringify(ambient.rMatrix.provenance, null, 2)}</pre>
    </div>}
  </div>;
}

export function realizedSolution(solution: Solution | undefined, realization: Realization): Solution | undefined {
  if (!solution) return undefined;
  if (realization === "bare") return solution;
  const artifact = (solution.derivedRealizations ?? []).find((candidate) => candidate.realization === realization);
  if (!artifact) return solution.realization === realization ? solution : undefined;
  return {
    ...solution,
    solutionId: artifact.realizationId,
    realization: artifact.realization,
    transformations: artifact.transformations,
    matrix: artifact.matrix,
    latex: artifact.latex,
    properties: artifact.properties,
    provenance: artifact.provenance,
    reflectionEquationCertificate: null,
  };
}

export function PropertyPanel({ solution }: { solution: Solution | undefined }) {
  if (!solution || solution.properties.length === 0) return <div className="empty-state">
    <strong>No structured property dossier for this realization yet.</strong>
    <p>Property providers are being added family by family. This is an unavailable capability, not a negative mathematical result.</p>
  </div>;
  return <div className="property-dossier">
    <div className="property-dossier-summary">
      <Badge tone="good">{solution.family}</Badge>
      <strong>{solution.realization} realization</strong>
      <span>{solution.properties.filter(({ status }) => status === "verifiedExact").length} exact identities</span>
    </div>
    <div className="property-grid property-grid--populated">
      {solution.properties.map((property) => <article key={property.propertyId}>
        <div className="property-heading">
          <span className={`property-status property-status--${property.status === "verifiedExact" ? "verified" : property.status === "conditional" ? "conditional" : "source"}`}>
            {property.status === "verifiedExact" ? "exact" : property.status === "computedExact" ? "computed" : property.status === "sourceIdentity" ? "source identity" : property.status}
          </span>
          <h4>{property.label}</h4>
        </div>
        <MathFormula latex={property.latex} />
        {property.spectrum.length > 0 && <div className="spectrum-table">
          <div><span>Eigenvalue</span><span>Multiplicity</span></div>
          {property.spectrum.map((item, index) => <div key={`${property.propertyId}-${index}`}>
            <MathFormula latex={item.latex} display={false} />
            <code>{item.multiplicity}</code>
          </div>)}
        </div>}
        {property.expression && property.kind === "determinant" && <div className="property-expression">
          <span>Exact expression</span><MathFormula latex={expressionToLatex(property.expression)} />
        </div>}
        <details><summary>Verification and assumptions</summary>
          <dl>
            <div><dt>Method</dt><dd><code>{property.verification.method}</code></dd></div>
            <div><dt>Engine</dt><dd>{property.verification.engineVersion}</dd></div>
            <div><dt>Residual</dt><dd>{property.verification.residualNonzeroCount ?? "not applicable"}</dd></div>
            <div><dt>Source</dt><dd>{property.sourceAnchors.map(({ source, anchor }) => `${source}${anchor ? `, ${anchor}` : ""}`).join("; ")}</dd></div>
          </dl>
          {property.assumptionsLatex.map((assumption) => <MathFormula key={assumption} latex={assumption} display={false} />)}
        </details>
      </article>)}
    </div>
  </div>;
}

export function FormulaPanel({ record, realization, engine, ambient, solutions, selected, onSelect }: {
  record: DiagramRecord;
  realization: Realization;
  engine: Catalogue["engine"];
  ambient: Catalogue["ambient"];
  solutions: Solution[];
  selected: Solution | undefined;
  onSelect: (solutionId: string) => void;
}) {
  const active = realizedSolution(selected, realization);
  if (realization === "dressed" && !active) return <div className="empty-state">
    <strong>No materialized dressing for this family yet.</strong>
    <p>Canonical diagonal dressings are exported family by family when their admissible gauge action has been encoded.</p>
  </div>;
  if (realization === "transported" && !active) return <div className="empty-state">
    <strong>No transported matrix artifact in this static record.</strong>
    <p>The representative permutation is retained with the diagram; this record does not require a matrix-level diagram-automorphism transport.</p>
  </div>;
  if (!active) return <div className="empty-state">
    <strong>No matrix artifact in this static record.</strong>
    <p>Status: {record.computation.status}. The diagram and classification remain browsable; a later compute provider can fill this panel without changing the page model.</p>
  </div>;
  return <>
    {solutions.length > 1 && <div className="candidate-picker">
      <div><strong>Choose a compatible K-matrix family</strong><span>The diagram alone does not resolve the coideal-parameter regime.</span></div>
      <div className="candidate-buttons">
        {solutions.map((solution) => <button key={solution.solutionId}
          className={solution.solutionId === selected?.solutionId ? "is-active" : ""}
          onClick={() => onSelect(solution.solutionId)}>{solution.family}</button>)}
      </div>
    </div>}
    <div className="solution-meta">
      <Badge tone="good">{active.family}</Badge>
      <Badge>{active.realization}</Badge>
      {active.reflectionEquationCertificate && <Badge tone={active.reflectionEquationCertificate.status === "verified" ? "good" : "warn"}>
        {active.reflectionEquationCertificate.status} {active.reflectionEquationCertificate.level}
      </Badge>}
      <span>{active.equation} reflection equation</span>
      <span>{active.matrix.dimensions[0]} dimensional representation</span>
    </div>
    {active.transformations.map((transformation, index) => <div className="transformation-card" key={`${transformation.kind}-${index}`}>
      <div><span>Transformation {index + 1}</span><strong>{transformation.kind}</strong></div>
      {transformation.latex && <MathFormula latex={transformation.latex} />}
      <code>{Object.keys(transformation.parameters).join(", ") || "no free parameters"}</code>
    </div>)}
    <MatrixView record={record} solution={active} engine={engine} ambient={ambient} />
  </>;
}

