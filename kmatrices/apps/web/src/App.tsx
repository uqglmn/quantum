import { useEffect, useMemo, useState } from "react";
import type { Catalogue, CatalogueManifest, DiagramRecord, DiagramSummary, Realization, Solution } from "./domain";
import { MathFormula } from "./components/MathFormula";
import { FamilyConfigurator } from "./components/FamilyConfigurator";
import { FamilyFormula } from "./components/FamilyFormula";
import { FamilyLibrary } from "./components/FamilyLibrary";
import { A3FamilyWorkspace } from "./components/A3FamilyWorkspace";
import { nearestFamilyFile, staticCatalogueProvider } from "./lib/catalogue";
import { expressionToLatex, formatExpression } from "./lib/expression";
import { affineTypeLatex, familyDefinition, familiesForAffineType, recordBelongsToFamily, type FamilyDefinition } from "./lib/families";
import { formulaBranchId } from "./lib/formulaBranches";
import { buildSolutionBundle, downloadText, safeFilename, solutionLatexDocument } from "./lib/solutionExport";

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "good" | "warn" }) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

function Availability({ available, children }: { available: boolean; children: React.ReactNode }) {
  return <span className={available ? "availability availability--yes" : "availability"}>
    <span aria-hidden="true">{available ? "●" : "○"}</span> {children}
  </span>;
}

function MatrixView({ record, solution, engine, ambient }: {
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

function RMatrixView({ ambient }: { ambient: Catalogue["ambient"] }) {
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

function realizedSolution(solution: Solution | undefined, realization: Realization): Solution | undefined {
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

function PropertyPanel({ solution }: { solution: Solution | undefined }) {
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

function FormulaPanel({ record, realization, engine, ambient, solutions, selected, onSelect }: {
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

function Inspector({ record, summary, engine, ambient, family, manifest, catalogue, onFileChange, onDiagramChange }: {
  record: DiagramRecord;
  summary: DiagramSummary;
  engine: Catalogue["engine"];
  ambient: Catalogue["ambient"];
  family: FamilyDefinition;
  manifest: CatalogueManifest;
  catalogue: Catalogue;
  onFileChange: (fileId: string) => void;
  onDiagramChange: (diagramId: string) => void;
}) {
  type InspectorTab = "qsp" | "k" | "r" | "equation" | "properties";
  const inspectorTabs: InspectorTab[] = ["qsp", "k", "r", "equation", "properties"];
  const [tab, setTab] = useState<InspectorTab>(() => {
    const requested = new URLSearchParams(window.location.search).get("view") as InspectorTab | null;
    return requested && inspectorTabs.includes(requested) ? requested : "qsp";
  });
  const [realization, setRealization] = useState<Realization>(
    "bare",
  );
  const solutions = [record.computation.solution, ...record.computation.candidates].filter(Boolean) as Solution[];
  const [solutionId, setSolutionId] = useState(solutions[0]?.solutionId ?? "");
  const selectedSolution = solutions.find((solution) => solution.solutionId === solutionId) ?? solutions[0];
  useEffect(() => setRealization("bare"), [record.id]);
  useEffect(() => setSolutionId(solutions[0]?.solutionId ?? ""), [record.id]);
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("view", tab);
    window.history.replaceState(null, "", url);
  }, [tab]);

  return <main className="inspector">
    <FamilyConfigurator family={family} manifest={manifest} catalogue={catalogue} selected={summary}
      onFileChange={onFileChange} onDiagramChange={onDiagramChange} />

    <section className="instance-heading">
      <div><div className="eyebrow">Current instance</div><h2><MathFormula latex={affineTypeLatex(record.spec.affineType)} display={false} /> · rank {record.spec.rank}</h2></div>
      <div className="badge-row">
        <Badge tone={record.classification.status.startsWith("Classified") ? "good" : "warn"}>{record.classification.status}</Badge>
        <Badge>{record.classification.regime.toLowerCase() === "nonquasistandard" ? "Non-quasistandard regime" : record.classification.regime}</Badge>
        <Badge>{record.classification.equation}</Badge>
      </div>
    </section>

    <section className="datum-strip">
      <div><span>X</span><code>{record.spec.X.length ? `{${record.spec.X.join(", ")}}` : "∅"}</code></div>
      <div><span>τ</span><code>[{record.spec.tau.join(", ")}]</code></div>
      <div><span>candidates</span><code>{record.classification.candidateFamilies.join(", ") || "—"}</code></div>
      <div><span>parameters</span><code>{Object.entries(record.classification.parameters).map(([key, value]) => `${key}=${formatExpression(value)}`).join(", ") || "—"}</code></div>
    </section>

    <div className="tabs" role="tablist" aria-label="Mathematical objects">
      {inspectorTabs.map((name) => <button key={name}
        role="tab" aria-selected={tab === name} className={tab === name ? "is-active" : ""} onClick={() => setTab(name)}>
        {name === "qsp" ? "QSP algebra" : name === "k" ? "K-matrix" : name === "r" ? "Ambient R" : name === "equation" ? "Reflection equation" : "Properties"}
      </button>)}
    </div>

    <section className="object-panel">
      {tab === "qsp" && <>
        <div className="panel-heading"><div><div className="eyebrow">Coideal presentation</div><h3>B<sub>c,s</sub>(X, τ)</h3></div><Availability available={record.capabilities.qspAlgebra}>instantiated presentation</Availability></div>
        <div className="scientific-metadata">
          <div><span>QSP record</span><code>{record.qsp.qspId}</code></div>
          <div><span>Levi nodes X</span><code>{record.qsp.indexSets.levi.join(", ") || "∅"}</code></div>
          <div><span>Boundary nodes</span><code>{record.qsp.indexSets.boundary.join(", ") || "∅"}</code></div>
          <div><span>Longest word</span><code>{record.qsp.theta.longestParabolicWord.join(" ") || "identity"}</code></div>
        </div>
        <div className="formula-block formula-block--large"><MathFormula latex={record.qsp.presentationLatex} /></div>
        <div className="formula-stack">
          <div><span>Quantum involution</span><MathFormula latex={record.qsp.theta.latex} /></div>
          {record.qsp.generatorGroups.map((group) => <div key={group.kind}><span>{group.kind.replace(/([A-Z])/g, " $1")}</span><MathFormula latex={group.latex} /></div>)}
          <div><span>Parameter domain</span><MathFormula latex={record.qsp.parameters.latex} /></div>
        </div>
        <p className="fine-print"><strong>Scope:</strong> this record instantiates the generator presentation and the reduced word for θ<sub>q</sub>. Expanded inhomogeneous Serre relations and family-specific admissibility constraints remain a separate symbolic provider. Source: <code>{String(record.qsp.provenance.Source)}</code>.</p>
      </>}
      {tab === "k" && <>
        <FamilyFormula family={family} regime={record.classification.regime} />
        <div className="instance-divider"><span>Current instance</span></div>
        <div className="panel-heading"><div><div className="eyebrow">Solution realisation</div><h3>Explicit boundary K-matrix</h3></div><Availability available={record.capabilities.kMatrix}>{record.computation.status}</Availability></div>
        <div className="segmented" aria-label="K-matrix realisation">
          <button className={realization === "bare" ? "is-active" : ""} onClick={() => setRealization("bare")}>Bare</button>
          <button className={realization === "dressed" ? "is-active" : ""} onClick={() => setRealization("dressed")}>Dressed</button>
          <button className={realization === "transported" ? "is-active" : ""} onClick={() => setRealization("transported")}>Transported</button>
        </div>
        <FormulaPanel record={record} realization={realization} engine={engine} ambient={ambient}
          solutions={solutions} selected={selectedSolution} onSelect={setSolutionId} />
      </>}
      {tab === "r" && <>
        <div className="panel-heading"><div><div className="eyebrow">Representation data</div><h3>Ambient R-matrix</h3></div><Availability available={record.capabilities.rMatrix}>sparse matrix</Availability></div>
        <div className="scientific-metadata">
          <div><span>Representation</span><code>{ambient.representation.representationId}</code></div>
          <div><span>Dimension</span><code>{ambient.representation.dimension} on V · {ambient.rMatrix.dimension} on V⊗V</code></div>
          <div><span>Basis</span><code>[{ambient.representation.basisLabels.join(", ")}]</code></div>
          <div><span>Convention</span><code>{ambient.representation.tensorBasisConvention} tensor basis</code></div>
          <div><span>Crossing parameter squared</span><code>{ambient.rMatrix.crossingParameterSquared ? formatExpression(ambient.rMatrix.crossingParameterSquared) : "not applicable"}</code></div>
        </div>
        <RMatrixView ambient={ambient} />
        <div className="definition-list">
          {ambient.rMatrix.operatorDefinitions.map((definition) => <details key={definition.symbol} open={definition.symbol === "f_q"}>
            <summary>{definition.symbol}</summary>
            <MathFormula latex={definition.latex} />
          </details>)}
        </div>
        <div className="identity-row">
          {ambient.rMatrix.properties.map((property) => <div key={property.kind}><Badge tone="good">{property.status === "verifiedExact" ? "exact check" : property.status === "verifiedExactSample" ? "exact sample" : "source identity"}</Badge><span>{property.kind}</span><MathFormula latex={property.latex} /></div>)}
        </div>
        <p className="fine-print">Formula record <code>{ambient.rMatrix.rMatrixId}</code>, with regular normalization and provenance <code>{String(ambient.rMatrix.provenance.Source)}</code>. The {ambient.rMatrix.dimension} × {ambient.rMatrix.dimension} sparse expression tree uses the displayed tensor basis and can be inspected or downloaded.</p>
      </>}
      {tab === "equation" && <>
        <div className="panel-heading"><div><div className="eyebrow">Boundary identity</div><h3>{record.reflectionEquation.kind} reflection equation</h3></div><Badge tone={record.reflectionEquation.verification.status === "verified" ? "good" : "warn"}>{record.reflectionEquation.verification.status}</Badge></div>
        <div className="formula-block formula-block--large"><MathFormula latex={record.reflectionEquation.latex} /></div>
        <div className="scientific-metadata">
          <div><span>Ambient R</span><code>{record.reflectionEquation.rMatrixId}</code></div>
          <div><span>Spectral convention</span><code>{record.reflectionEquation.conventions.spectralParameters}</code></div>
          <div><span>Leg convention</span><code>{record.reflectionEquation.conventions.legNumbering}</code></div>
          <div><span>Partial transpose</span><code>{record.reflectionEquation.conventions.partialTranspose ?? "none"}</code></div>
        </div>
        {record.reflectionEquation.verification.certificateIds.length > 0 && <div className="certificate-list">
          <span>Exact per-solution certificates</span>
          {record.reflectionEquation.verification.certificateIds.map((id) => <code key={id}>{id}</code>)}
        </div>}
        <p className="fine-print">The identity is bound to the displayed ambient R-record and this diagram’s equation type. A verified label means the exported sparse K-matrix has zero exact symbolic tensor residual as a rational-function identity, for generic parameters away from poles. Certification covers the computable untwisted A/B/C/D catalogue. Mixed candidate outcomes are labelled conditional; twisted families remain explicitly not computed.</p>
      </>}
      {tab === "properties" && <>
        <div className="panel-heading"><div><div className="eyebrow">Symbolic analysis</div><h3>Properties and identities</h3></div><Availability available={record.capabilities.properties.length > 0}>{record.capabilities.properties.length} available</Availability></div>
        <div className="segmented" aria-label="Property realization">
          <button className={realization === "bare" ? "is-active" : ""} onClick={() => setRealization("bare")}>Bare</button>
          <button className={realization === "dressed" ? "is-active" : ""} onClick={() => setRealization("dressed")}>Dressed</button>
          <button className={realization === "transported" ? "is-active" : ""} onClick={() => setRealization("transported")}>Transported</button>
        </div>
        <PropertyPanel solution={realizedSolution(selectedSolution, realization)} />
      </>}
    </section>
  </main>;
}

export function App() {
  const [manifest, setManifest] = useState<CatalogueManifest | null>(null);
  const [fileId, setFileId] = useState("");
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null);
  const [diagram, setDiagram] = useState<DiagramRecord | null>(null);
  const [diagramId, setDiagramId] = useState("");
  const [familyId, setFamilyId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    staticCatalogueProvider.manifest(controller.signal).then((value) => {
      const search = new URLSearchParams(window.location.search);
      const requestedType = search.get("type");
      const requestedRank = Number(search.get("rank"));
      const requestedFamily = search.get("family");
      const exactRequestedFile = value.files.find((file) => file.affineType === requestedType && file.rank === requestedRank);
      const familyRequestedFile = requestedType && requestedFamily
        ? nearestFamilyFile(value.files, requestedType, requestedFamily, requestedRank)
        : undefined;
      const requestedFile = familyRequestedFile ?? exactRequestedFile;
      const pilotFile = value.files.find((file) => file.affineType === "C(1)" && file.rank === 4);
      setManifest(value);
      setFileId(requestedFile?.id ?? pilotFile?.id ?? value.files[0]?.id ?? "");
      setFamilyId(requestedFamily ?? (requestedFile || pilotFile ? "C.1" : ""));
    }).catch((reason: Error) => setError(reason.message));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const file = manifest?.files.find((candidate) => candidate.id === fileId);
    if (!file) return;
    const controller = new AbortController();
    staticCatalogueProvider.catalogue(file.path, controller.signal).then((value) => {
      const search = new URLSearchParams(window.location.search);
      const availableFamilies = familiesForAffineType(value.catalogue.affineType)
        .filter((family) => file.families.includes(family.id));
      const requestedFamily = search.get("family");
      const nextFamily = availableFamilies.some((family) => family.id === familyId) ? familyId
        : availableFamilies.some((family) => family.id === requestedFamily) ? requestedFamily!
          : availableFamilies[0]?.id ?? "";
      const familyRecords = value.diagrams.filter((record) => recordBelongsToFamily(record, nextFamily));
      const requestedDiagram = search.get("diagram");
      const requestedCase = search.get("case");
      const preferredDiagram = nextFamily === "A.3"
        ? familyRecords.find((record) => formulaBranchId(record, "A.3") === requestedCase)
          ?? familyRecords.find((record) => formulaBranchId(record, "A.3") === "interior")
        : undefined;
      const nextDiagram = familyRecords.find((record) => record.id === requestedDiagram) ?? preferredDiagram ?? familyRecords[0] ?? value.diagrams[0];
      setCatalogue(value); setDiagram(null); setFamilyId(nextFamily); setDiagramId(nextDiagram?.id ?? ""); setError("");
    }).catch((reason: Error) => setError(reason.message));
    return () => controller.abort();
  }, [manifest, fileId]);

  const records = useMemo(() => catalogue?.diagrams.filter((record) => recordBelongsToFamily(record, familyId)) ?? [], [catalogue, familyId]);
  const selected = catalogue?.diagrams.find((record) => record.id === diagramId && recordBelongsToFamily(record, familyId)) ?? records[0];
  const family = familyDefinition(familyId, catalogue?.families);

  useEffect(() => {
    if (!selected) { setDiagram(null); return; }
    const controller = new AbortController();
    setDiagram((current) => current?.id === selected.id ? current : null);
    staticCatalogueProvider.diagram(selected.detailPath, controller.signal).then((detail) => {
      if (detail.catalogue.id !== catalogue?.catalogue.id || detail.diagram.id !== selected.id) {
        throw new Error(`Diagram detail identity mismatch for ${selected.id}`);
      }
      setDiagram(detail.diagram); setError("");
    }).catch((reason: Error) => {
      if (reason.name !== "AbortError") setError(reason.message);
    });
    return () => controller.abort();
  }, [catalogue?.catalogue.id, selected?.id, selected?.detailPath]);

  useEffect(() => {
    if (!catalogue || !familyId || selected) return;
    setDiagramId(records[0]?.id ?? "");
  }, [catalogue, familyId, records, selected]);

  useEffect(() => {
    if (!catalogue || !selected || !familyId) return;
    const url = new URL(window.location.href);
    url.searchParams.set("type", catalogue.catalogue.affineType);
    url.searchParams.set("rank", String(catalogue.catalogue.rank));
    url.searchParams.set("family", familyId);
    url.searchParams.set("diagram", selected.id);
    const selectedCase = formulaBranchId(selected, familyId);
    if (selectedCase) url.searchParams.set("case", selectedCase);
    else url.searchParams.delete("case");
    window.history.replaceState(null, "", url);
  }, [catalogue, familyId, selected]);

  const selectFamily = (nextFileId: string, nextFamilyId: string) => {
    setFamilyId(nextFamilyId);
    if (nextFileId !== fileId) {
      setFileId(nextFileId);
      return;
    }
    const familyRecords = catalogue?.diagrams.filter((record) => recordBelongsToFamily(record, nextFamilyId)) ?? [];
    const first = nextFamilyId === "A.3"
      ? familyRecords.find((record) => formulaBranchId(record, "A.3") === "interior") ?? familyRecords[0]
      : familyRecords[0];
    setDiagramId(first?.id ?? "");
  };

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><span className="brand-mark">K</span><div><strong>QRE</strong><small>Family workbench</small></div></div>
      <div className="engine-status"><span></span>{manifest ? `engine ${manifest.engine.version} · schema ${manifest.schemaVersion}` : "loading catalogue"}</div>
      <span className="source-label">Interactive paper companion</span>
    </header>
    <div className="workspace">
      <FamilyLibrary manifest={manifest} selectedFileId={fileId} selectedFamilyId={familyId} onSelect={selectFamily} />
      {error ? <main className="load-error"><h2>Catalogue unavailable</h2><p>{error}</p><p>Run the catalogue export script before starting the app.</p></main>
        : selected && diagram?.id === selected.id && catalogue && manifest && family ? (family.id === "A.3"
          ? <A3FamilyWorkspace record={diagram} selected={selected} family={family} manifest={manifest} catalogue={catalogue}
            onFileChange={setFileId} onDiagramChange={setDiagramId} />
          : <Inspector record={diagram} summary={selected} engine={catalogue.engine} ambient={catalogue.ambient}
            family={family} manifest={manifest} catalogue={catalogue} onFileChange={setFileId} onDiagramChange={setDiagramId} />)
          : <main className="loading">Loading mathematical catalogue…</main>}
    </div>
  </div>;
}
