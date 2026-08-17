import { useEffect, useMemo, useState } from "react";
import type { Catalogue, CatalogueManifest, DiagramRecord, Realization, Solution } from "./domain";
import { SatakeDiagram } from "./components/SatakeDiagram";
import { staticCatalogueProvider } from "./lib/catalogue";
import { formatExpression } from "./lib/expression";

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "good" | "warn" }) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

function Availability({ available, children }: { available: boolean; children: React.ReactNode }) {
  return <span className={available ? "availability availability--yes" : "availability"}>
    <span aria-hidden="true">{available ? "●" : "○"}</span> {children}
  </span>;
}

function MatrixView({ solution }: { solution: Solution }) {
  const [view, setView] = useState<"sparse" | "latex">("sparse");
  return <div className="matrix-view">
    <div className="subtabs">
      <button className={view === "sparse" ? "is-active" : ""} onClick={() => setView("sparse")}>Sparse entries</button>
      <button className={view === "latex" ? "is-active" : ""} onClick={() => setView("latex")}>LaTeX</button>
    </div>
    {view === "sparse" ? <div className="sparse-table" role="table">
      <div className="sparse-heading">{solution.matrix.dimensions.join(" × ")} · {solution.matrix.entries.length} nonzero entries · basis [{solution.basisLabels.join(", ")}]</div>
      {solution.matrix.entries.map((entry) => <div className="sparse-row" key={entry.index.join("-")}>
        <code>K<sub>{entry.index[0] + 1},{entry.index[1] + 1}</sub></code>
        <span>{formatExpression(entry.value)}</span>
      </div>)}
    </div> : <pre className="latex-source">{solution.latex}</pre>}
  </div>;
}

function FormulaPanel({ record, realization }: { record: DiagramRecord; realization: Realization }) {
  const solutions = [record.computation.solution, ...record.computation.candidates].filter(Boolean) as Solution[];
  const selected = solutions[0];
  if (realization === "dressed") return <div className="empty-state">
    <strong>Dressing is a transformation layer.</strong>
    <p>The static catalogue preserves the bare matrix. A diagonal or general dressing matrix G will produce G⁻¹KG (standard) or GKG (transposed) through the compute provider.</p>
    <code>bare → dress(G) → normalise(u₀) → analyse</code>
  </div>;
  if (realization === "nonstandard" && record.classification.regime !== "Nonquasistandard") return <div className="empty-state">
    This diagram is not classified in the non-quasistandard regime.
  </div>;
  if (!selected) return <div className="empty-state">
    <strong>No matrix artifact in this static record.</strong>
    <p>Status: {record.computation.status}. The diagram and classification remain browsable; a later compute provider can fill this panel without changing the page model.</p>
  </div>;
  return <>
    {solutions.length > 1 && <p className="notice">The diagram admits {solutions.length} catalogue candidates. Showing {selected.family}; family selection is the next UI increment.</p>}
    <div className="solution-meta">
      <Badge tone="good">{selected.family}</Badge>
      <span>{selected.equation} reflection equation</span>
      <span>{selected.matrix.dimensions[0]} dimensional representation</span>
    </div>
    <MatrixView solution={selected} />
  </>;
}

function Inspector({ record }: { record: DiagramRecord }) {
  const [tab, setTab] = useState<"qsp" | "k" | "r" | "equation" | "properties">("qsp");
  const [realization, setRealization] = useState<Realization>(
    record.classification.regime === "Nonquasistandard" ? "nonstandard" : "bare",
  );
  useEffect(() => setRealization(record.classification.regime === "Nonquasistandard" ? "nonstandard" : "bare"), [record.id]);

  return <main className="inspector">
    <section className="hero-card">
      <div>
        <div className="eyebrow">{record.spec.affineType} · rank {record.spec.rank}</div>
        <h2>{record.classification.family ?? "Ambiguous family"}</h2>
        <div className="badge-row">
          <Badge tone={record.classification.status.startsWith("Classified") ? "good" : "warn"}>{record.classification.status}</Badge>
          <Badge>{record.classification.regime}</Badge>
          <Badge>{record.classification.equation}</Badge>
        </div>
      </div>
      <SatakeDiagram record={record} />
    </section>

    <section className="datum-strip">
      <div><span>X</span><code>{record.spec.X.length ? `{${record.spec.X.join(", ")}}` : "∅"}</code></div>
      <div><span>τ</span><code>[{record.spec.tau.join(", ")}]</code></div>
      <div><span>candidates</span><code>{record.classification.candidateFamilies.join(", ") || "—"}</code></div>
      <div><span>parameters</span><code>{Object.entries(record.classification.parameters).map(([key, value]) => `${key}=${formatExpression(value)}`).join(", ") || "—"}</code></div>
    </section>

    <div className="tabs" role="tablist" aria-label="Mathematical objects">
      {(["qsp", "k", "r", "equation", "properties"] as const).map((name) => <button key={name}
        role="tab" aria-selected={tab === name} className={tab === name ? "is-active" : ""} onClick={() => setTab(name)}>
        {name === "qsp" ? "QSP algebra" : name === "k" ? "K-matrix" : name === "r" ? "Ambient R" : name === "equation" ? "Reflection equation" : "Properties"}
      </button>)}
    </div>

    <section className="object-panel">
      {tab === "qsp" && <>
        <div className="panel-heading"><div><div className="eyebrow">Coideal presentation</div><h3>B<sub>c,s</sub>(X, τ)</h3></div><Availability available={record.capabilities.qspAlgebra}>{record.capabilities.qspAlgebra ? "explicit" : "formal template"}</Availability></div>
        <div className="formula-block">B<sub>c,s</sub>(X,τ) = ⟨ U<sub>q</sub>(𝔤<sub>X</sub>), U<sup>0</sup><sub>Θ</sub>, B<sub>i</sub> : i ∉ X ⟩</div>
        <div className="formula-block">B<sub>i</sub> = F<sub>i</sub> + c<sub>i</sub> θ<sub>q</sub>(F<sub>i</sub>K<sub>i</sub>)K<sub>i</sub><sup>−1</sup> + s<sub>i</sub>K<sub>i</sub><sup>−1</sup></div>
        <p className="fine-print">This is the generic QSP generator template instantiated by the displayed X and τ. Explicit θ<sub>q</sub>, parameter constraints, and relation expansion are a separate engine capability and are not yet asserted by this record.</p>
      </>}
      {tab === "k" && <>
        <div className="panel-heading"><div><div className="eyebrow">Realisation</div><h3>Boundary K-matrix</h3></div><Availability available={record.capabilities.kMatrix}>{record.computation.status}</Availability></div>
        <div className="segmented" aria-label="K-matrix realisation">
          <button className={realization === "bare" ? "is-active" : ""} onClick={() => setRealization("bare")}>Bare</button>
          <button className={realization === "dressed" ? "is-active" : ""} onClick={() => setRealization("dressed")}>Dressed</button>
          <button className={realization === "nonstandard" ? "is-active" : ""} onClick={() => setRealization("nonstandard")}>Non-standard</button>
        </div>
        <FormulaPanel record={record} realization={realization} />
      </>}
      {tab === "r" && <>
        <div className="panel-heading"><div><div className="eyebrow">Representation data</div><h3>Ambient R-matrix</h3></div><Availability available={record.capabilities.rMatrix}>{record.capabilities.rMatrix ? "available" : "not exported"}</Availability></div>
        <div className="empty-state">The representation registry and normalized R-matrix provider are the next mathematical backend boundary. The UI already reserves provenance, normalization, basis, and sparse/dense views for it.</div>
      </>}
      {tab === "equation" && <>
        <div className="panel-heading"><div><div className="eyebrow">Boundary identity</div><h3>{record.classification.equation} reflection equation</h3></div><Badge>{record.classification.equation}</Badge></div>
        {record.classification.equation === "Transposed" ?
          <div className="formula-block formula-block--large">R<sub>21</sub>(u/v) K<sub>1</sub>(u) R<sup>t₁</sup><sub>12</sub>(uv) K<sub>2</sub>(v) = K<sub>2</sub>(v) R<sup>t₁</sup><sub>21</sub>(uv) K<sub>1</sub>(u) R<sub>12</sub>(u/v)</div> :
          <div className="formula-block formula-block--large">R<sub>21</sub>(u/v) K<sub>1</sub>(u) R<sub>12</sub>(uv) K<sub>2</sub>(v) = K<sub>2</sub>(v) R<sub>21</sub>(uv) K<sub>1</sub>(u) R<sub>12</sub>(u/v)</div>}
        <p className="fine-print">Convention-sensitive ordering and transposition metadata will be bound to the ambient R record before this identity is marked verified.</p>
      </>}
      {tab === "properties" && <>
        <div className="panel-heading"><div><div className="eyebrow">Symbolic analysis</div><h3>Properties and identities</h3></div><Availability available={record.capabilities.properties.length > 0}>{record.capabilities.properties.length} computed</Availability></div>
        <div className="property-grid">
          {[
            ["Eigenvalues", "Spectrum, multiplicities and genericity conditions"],
            ["Characteristic identity", "Minimal and characteristic polynomial identities"],
            ["Factorisation", "Scalar, block and polynomial factorisations"],
            ["Regularity", "K(1), unitarity and normalization checks"],
          ].map(([title, description]) => <article key={title}><span>planned</span><h4>{title}</h4><p>{description}</p></article>)}
        </div>
      </>}
    </section>
  </main>;
}

export function App() {
  const [manifest, setManifest] = useState<CatalogueManifest | null>(null);
  const [fileId, setFileId] = useState("");
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null);
  const [diagramId, setDiagramId] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    staticCatalogueProvider.manifest(controller.signal).then((value) => {
      setManifest(value); setFileId(value.files[0]?.id ?? "");
    }).catch((reason: Error) => setError(reason.message));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const file = manifest?.files.find((candidate) => candidate.id === fileId);
    if (!file) return;
    const controller = new AbortController();
    staticCatalogueProvider.catalogue(file.path, controller.signal).then((value) => {
      setCatalogue(value); setDiagramId(value.diagrams[0]?.id ?? ""); setError("");
    }).catch((reason: Error) => setError(reason.message));
    return () => controller.abort();
  }, [manifest, fileId]);

  const records = useMemo(() => catalogue?.diagrams.filter((record) => {
    const haystack = `${record.id} ${record.classification.family} ${record.classification.candidateFamilies.join(" ")} ${record.classification.regime}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  }) ?? [], [catalogue, query]);
  const selected = catalogue?.diagrams.find((record) => record.id === diagramId) ?? records[0];

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><span className="brand-mark">K</span><div><strong>QRE</strong><small>Satake explorer</small></div></div>
      <div className="engine-status"><span></span>{manifest ? `engine ${manifest.engine.version} · schema ${manifest.schemaVersion}` : "loading catalogue"}</div>
      <span className="source-label">Research prototype</span>
    </header>
    <div className="workspace">
      <aside className="sidebar">
        <div className="sidebar-heading"><div className="eyebrow">Catalogue</div><h1>Generalized Satake diagrams</h1></div>
        <label className="field"><span>Affine type and rank</span><select value={fileId} onChange={(event) => setFileId(event.target.value)}>
          {manifest?.files.map((file) => <option value={file.id} key={file.id}>{file.affineType} · n={file.rank} ({file.diagramCount})</option>)}
        </select></label>
        <label className="field"><span>Filter this catalogue</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="family, regime, ID…" /></label>
        <div className="result-count">{records.length} diagram{records.length === 1 ? "" : "s"}</div>
        <nav className="diagram-list" aria-label="Diagram results">
          {records.map((record) => <button key={record.id} className={record.id === selected?.id ? "diagram-option is-active" : "diagram-option"} onClick={() => setDiagramId(record.id)}>
            <SatakeDiagram record={record} compact />
            <span><strong>{record.classification.family ?? (record.classification.candidateFamilies.join(" / ") || "Unclassified")}</strong><small>X={record.spec.X.length ? `{${record.spec.X.join(",")}}` : "∅"} · {record.classification.regime}</small></span>
          </button>)}
        </nav>
      </aside>
      {error ? <main className="load-error"><h2>Catalogue unavailable</h2><p>{error}</p><p>Run the catalogue export script before starting the app.</p></main> : selected ? <Inspector record={selected} /> : <main className="loading">Loading mathematical catalogue…</main>}
    </div>
  </div>;
}
