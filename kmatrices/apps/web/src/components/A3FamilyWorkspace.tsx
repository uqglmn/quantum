import { useEffect, useMemo, useState } from "react";
import type { Catalogue, CatalogueManifest, DiagramRecord, DiagramSummary, FamilyFormulaBranch, Realization, Solution } from "../domain";
import type { FamilyDefinition } from "../lib/families";
import { affineTypeLatex, parameterValue } from "../lib/families";
import { formulaBranchId } from "../lib/formulaBranches";
import { downloadText, safeFilename, solutionWolframNotebook, solutionWolframScript } from "../lib/solutionExport";
import { A3GeneralDiagram } from "./A3GeneralDiagram";
import { MathFormula } from "./MathFormula";
import { SatakeDiagram } from "./SatakeDiagram";

type BranchTab = "overview" | "properties" | "examples" | "verification";

function familySolution(record: DiagramRecord, familyId: string): Solution | undefined {
  return [record.computation.solution, ...record.computation.candidates]
    .filter(Boolean).find((solution) => solution?.family === familyId) as Solution | undefined;
}

function realizedSolution(solution: Solution | undefined, realization: Realization): Solution | undefined {
  if (!solution || realization === "bare") return solution;
  const artifact = solution.derivedRealizations.find((candidate) => candidate.realization === realization);
  if (!artifact) return undefined;
  return { ...solution, solutionId: artifact.realizationId, realization: artifact.realization,
    transformations: artifact.transformations, matrix: artifact.matrix, latex: artifact.latex,
    properties: artifact.properties, provenance: artifact.provenance, reflectionEquationCertificate: null };
}

function parameterSummary(record: DiagramSummary): string {
  return ["l", "r", "t"].map((key) => `${key === "l" ? "ℓ" : key}=${parameterValue(record, key) ?? "?"}`).join(" · ");
}

function BranchProperties({ branch, solution, rank }: { branch: FamilyFormulaBranch; solution: Solution | undefined; rank: number }) {
  return <div className="branch-properties-view">
    <div className="general-property-strip">
      <div className="branch-section-label">General-rank identities</div>
      <div>{branch.properties.map((property) => <article key={property.kind}>
        <span>{property.status}</span><MathFormula latex={property.latex} />
      </article>)}</div>
    </div>
    <div className="example-dossier-heading"><div className="branch-section-label">Explicit rank-{rank} example</div>
      <p>These calculations belong to the selected finite-rank specialization; they are evidence and examples, not the definition of the general case.</p></div>
    {!solution?.properties.length ? <div className="branch-empty">No structured properties are available for this selected realization.</div> : <div className="branch-property-list">
    {solution.properties.map((property) => <article key={property.propertyId}>
      <header><span>{property.status === "verifiedExact" ? "exact" : property.status}</span><h4>{property.label}</h4></header>
      <MathFormula latex={property.latex} />
      {property.spectrum.length > 0 && <div className="branch-spectrum">
        {property.spectrum.map((item, index) => <div key={index}><MathFormula latex={item.latex} display={false} /><small>multiplicity {item.multiplicity}</small></div>)}
      </div>}
    </article>)}</div>}
  </div>;
}

function BranchCard({ branch, examples, record, selected, active, realization, ambient, rankFiles, currentFileId,
  onOpen, onClose, onSelect, onRankChange, onRealizationChange }: {
  branch: FamilyFormulaBranch;
  examples: DiagramSummary[];
  record: DiagramRecord;
  selected: DiagramSummary;
  active: boolean;
  realization: Realization;
  ambient: Catalogue["ambient"];
  rankFiles: CatalogueManifest["files"];
  currentFileId: string;
  onOpen: () => void;
  onClose: () => void;
  onSelect: (id: string) => void;
  onRankChange: (id: string) => void;
  onRealizationChange: (realization: Realization) => void;
}) {
  const [tab, setTab] = useState<BranchTab>("overview");
  const bare = active ? familySolution(record, "A.3") : undefined;
  const solution = realizedSolution(bare, realization);
  useEffect(() => setTab("overview"), [branch.branchId]);
  const download = (kind: "wl" | "nb") => {
    if (!solution) return;
    const stem = safeFilename(`${record.id}-${solution.realization}`);
    const content = kind === "wl" ? solutionWolframScript(record, solution, ambient) : solutionWolframNotebook(record, solution, ambient);
    downloadText(`${stem}.${kind}`, content, kind === "wl" ? "text/plain" : "application/vnd.wolfram.mathematica");
  };

  return <details className={`formula-branch formula-branch--${branch.kind}`} open={active}>
    <summary onClick={(event) => { event.preventDefault(); active ? onClose() : onOpen(); }}>
      <span className="branch-index">{branch.kind === "generic" ? "General" : branch.kind}</span>
      <span className="branch-title"><strong>{branch.label}</strong><small>{branch.description}</small></span>
      <span className="branch-condition"><MathFormula latex={branch.constraintsLatex.slice(0, 2).join(",\\quad ")} display={false} /></span>
      <span className={`branch-verification branch-verification--${branch.verification.status}`}>
        {branch.verification.status === "verified" && branch.verification.level === "exactSample"
          ? "checked samples"
          : branch.verification.status}
      </span>
    </summary>
    <div className="branch-body">
      <div className="branch-tabs" role="tablist" aria-label={`${branch.label} content`}>
        {(["overview", "properties", "examples", "verification"] as BranchTab[]).map((name) => <button key={name}
          className={tab === name ? "is-active" : ""} onClick={() => setTab(name)}>{name}</button>)}
        <span className="general-rank-marker">arbitrary rank n</span>
      </div>

      {tab === "overview" && <div className="branch-overview">
        <div className="branch-diagram">
          <div className="branch-section-label">General-rank Satake template</div>
          <A3GeneralDiagram branch={branch} />
          <small>This is a symbolic representative for arbitrary admissible rank n, with N=n+1. Dashed chains stand for a variable number of nodes; endpoint and parity variants are controlled by t. Finite-rank diagrams appear under Examples.</small>
        </div>
        <div className="branch-formula">
          <div className="branch-section-label">Subfamily formula</div>
          {branch.formula ? <>
            <MathFormula latex={branch.formula.latex} />
            <div className="branch-definitions">{branch.formula.definitions.map((definition) => <div key={definition.definitionId}>
              <span>{definition.label}</span><MathFormula latex={definition.latex} />
            </div>)}</div>
            <div className="branch-assumption"><span>Domain</span><MathFormula latex={branch.formula.assumptionsLatex} display={false} /></div>
          </> : <div className="branch-empty">Formula specialization is not yet encoded.</div>}
        </div>
      </div>}

      {tab === "properties" && <BranchProperties branch={branch} solution={solution} rank={selected.spec.rank} />}

      {tab === "examples" && <div className="branch-examples">
        <div className="example-toolbar">
          <div><span>Example rank n</span><div className="choice-row">{rankFiles.map((file) => <button key={file.id}
            className={file.id === currentFileId ? "is-active" : ""} onClick={() => onRankChange(file.id)}>{file.rank}</button>)}</div></div>
          <div><span>Realization</span><div className="choice-row">
            <button className={realization === "bare" ? "is-active" : ""} onClick={() => onRealizationChange("bare")}>Bare</button>
            <button className={realization === "dressed" ? "is-active" : ""} onClick={() => onRealizationChange("dressed")}>Dressed</button>
          </div></div>
          <div className="branch-downloads">
            <button disabled={!solution} onClick={() => download("nb")}>Selected example notebook ↓</button>
            <button disabled={!solution} onClick={() => download("wl")}>Wolfram script ↓</button>
          </div>
        </div>
        <div className="selected-example">
          <div className="selected-example-diagram"><div className="branch-section-label">Explicit specialization · rank {selected.spec.rank} · {parameterSummary(selected)}</div>
            <SatakeDiagram record={selected} /></div>
          <div className="selected-example-matrix"><div className="branch-section-label">Explicit K-matrix</div>
            {solution ? <MathFormula latex={`K(u)=${solution.latex}`} /> : <div className="branch-empty">This realization is not materialized for the selected example.</div>}
          </div>
        </div>
        <div className="branch-example-heading"><strong>{examples.length} catalogue specializations at rank {selected.spec.rank}</strong><span>Select a diagram to replace the explicit example above.</span></div>
        <div className="example-card-grid">{examples.map((example) => <button key={example.id} className={example.id === selected.id ? "is-active" : ""} onClick={() => onSelect(example.id)}>
          <SatakeDiagram record={example} compact /><span><strong>{parameterSummary(example)}</strong><small>X={example.spec.X.length ? `{${example.spec.X.join(",")}}` : "∅"}</small></span>
        </button>)}</div>
      </div>}

      {tab === "verification" && <div className="branch-verification-panel">
        <div><span>Family-level result</span><strong>{branch.verification.level}</strong><code>{branch.verification.method}</code></div>
        <div><span>Equation</span><strong>{branch.verification.equation}</strong><MathFormula latex={record.reflectionEquation.latex} /></div>
        <div><span>Finite-rank example · n={selected.spec.rank}</span><strong>{solution?.reflectionEquationCertificate?.status ?? "source-level evidence"}</strong>
          <code>{solution?.reflectionEquationCertificate?.certificateId ?? "—"}</code></div>
        <p>The family-level statement applies for arbitrary admissible rank. The certificate and downloaded notebook concern the explicitly selected finite-rank example; the notebook reconstructs its sparse K- and R-matrices and evaluates a reproducible generic numerical residual.</p>
      </div>}
    </div>
  </details>;
}

export function A3FamilyWorkspace({ record, selected, family, manifest, catalogue, onFileChange, onDiagramChange }: {
  record: DiagramRecord;
  selected: DiagramSummary;
  family: FamilyDefinition;
  manifest: CatalogueManifest;
  catalogue: Catalogue;
  onFileChange: (id: string) => void;
  onDiagramChange: (id: string) => void;
}) {
  const branches = family.parameterDomain?.branches ?? [];
  const grouped = useMemo(() => new Map(branches.map((branch) => [branch.branchId,
    catalogue.diagrams.filter((candidate) => formulaBranchId(candidate, "A.3") === branch.branchId)])), [branches, catalogue.diagrams]);
  const selectedBranch = formulaBranchId(selected, "A.3") ?? branches[0]?.branchId ?? "";
  const [openBranch, setOpenBranch] = useState(selectedBranch);
  const [realization, setRealization] = useState<Realization>("bare");
  const rankFiles = manifest.files.filter((file) => file.affineType === "A(1)" && file.families.includes("A.3"));
  useEffect(() => setOpenBranch(selectedBranch), [selectedBranch]);
  useEffect(() => setRealization("bare"), [record.id]);

  const open = (branchId: string) => {
    setOpenBranch(branchId);
    const first = grouped.get(branchId)?.[0];
    if (first && formulaBranchId(selected, "A.3") !== branchId) onDiagramChange(first.id);
  };

  return <main className="inspector family-workspace">
    <section className="general-family-header">
      <div><div className="section-kicker">General-rank family</div><div className="family-title-row"><h2>{family.title}</h2>
        <span className="family-status">paper formula</span></div><p>{family.description}</p></div>
      <div className="general-family-domain"><span>Ambient type</span><MathFormula latex={affineTypeLatex(record.spec.affineType)} display={false} />
        <span>Family domain</span><MathFormula latex={family.parameterDomain?.constraints.map(({ latex }) => latex).join(",\\quad ") ?? "N>2"} display={false} />
        <small>The rank n is arbitrary (N=n+1). The exported ranks 2–6 are only an example library.</small></div>
    </section>
    <section className="family-workspace-heading">
      <div><div className="eyebrow">Formula atlas</div><h2>Arbitrary-rank cases and specializations</h2><p>Each card states a subfamily for general rank n. Concrete diagrams and explicit matrices at ranks 2–6 are kept separately as examples.</p></div>
      <div className="atlas-scope"><strong>n</strong><span>arbitrary admissible rank</span><small>N=n+1 · standard reflection equation</small></div>
    </section>
    <div className="formula-branch-list">
      {branches.map((branch) => <BranchCard key={branch.branchId} branch={branch} examples={grouped.get(branch.branchId) ?? []}
        record={record} selected={selected} active={openBranch === branch.branchId} realization={realization} ambient={catalogue.ambient}
        rankFiles={rankFiles} currentFileId={catalogue.catalogue.id}
        onOpen={() => open(branch.branchId)} onClose={() => setOpenBranch("")} onSelect={onDiagramChange}
        onRankChange={onFileChange} onRealizationChange={setRealization} />)}
    </div>
    <details className="ambient-disclosure">
      <summary><span>Ambient and algebra data</span><small>QSP presentation · ambient R-matrix · reflection equation</small></summary>
      <div>
        <section><div className="branch-section-label">QSP algebra</div><MathFormula latex={record.qsp.presentationLatex} /></section>
        <section><div className="branch-section-label">Ambient R-matrix</div><MathFormula latex={catalogue.ambient.rMatrix.latex} /></section>
        <section><div className="branch-section-label">Reflection equation</div><MathFormula latex={record.reflectionEquation.latex} /></section>
      </div>
    </details>
  </main>;
}
