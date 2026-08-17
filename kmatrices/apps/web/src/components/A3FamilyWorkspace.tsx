import { useEffect, useMemo, useState } from "react";
import type { Catalogue, CatalogueManifest, DiagramRecord, DiagramSummary, FamilyFormulaBranch, Realization, Solution } from "../domain";
import type { FamilyDefinition } from "../lib/families";
import { affineTypeLatex, parameterValue } from "../lib/families";
import { formulaBranchId } from "../lib/formulaBranches";
import { downloadText, safeFilename, solutionWolframNotebook, solutionWolframScript } from "../lib/solutionExport";
import { FamilyConfigurator } from "./FamilyConfigurator";
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

function BranchProperties({ solution }: { solution: Solution | undefined }) {
  if (!solution?.properties.length) return <div className="branch-empty">No structured properties are available for this realization.</div>;
  return <div className="branch-property-list">
    {solution.properties.map((property) => <article key={property.propertyId}>
      <header><span>{property.status === "verifiedExact" ? "exact" : property.status}</span><h4>{property.label}</h4></header>
      <MathFormula latex={property.latex} />
      {property.spectrum.length > 0 && <div className="branch-spectrum">
        {property.spectrum.map((item, index) => <div key={index}><MathFormula latex={item.latex} display={false} /><small>multiplicity {item.multiplicity}</small></div>)}
      </div>}
    </article>)}
  </div>;
}

function BranchCard({ branch, examples, record, selected, active, realization, ambient, onOpen, onClose, onSelect }: {
  branch: FamilyFormulaBranch;
  examples: DiagramSummary[];
  record: DiagramRecord;
  selected: DiagramSummary;
  active: boolean;
  realization: Realization;
  ambient: Catalogue["ambient"];
  onOpen: () => void;
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const [tab, setTab] = useState<BranchTab>("overview");
  const representative = examples.find(({ id }) => id === selected.id) ?? examples[0];
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
      <span className="branch-condition"><MathFormula latex={branch.constraintsLatex.slice(0, 2).join(",\quad ")} display={false} /></span>
      <span className={`branch-verification branch-verification--${branch.verification.status}`}>{branch.verification.status === "verified" ? "verified" : branch.verification.status}</span>
    </summary>
    <div className="branch-body">
      <div className="branch-tabs" role="tablist" aria-label={`${branch.label} content`}>
        {(["overview", "properties", "examples", "verification"] as BranchTab[]).map((name) => <button key={name}
          className={tab === name ? "is-active" : ""} onClick={() => setTab(name)}>{name}</button>)}
        <div className="branch-downloads">
          <button disabled={!solution} onClick={() => download("nb")}>Notebook ↓</button>
          <button disabled={!solution} onClick={() => download("wl")}>Wolfram script ↓</button>
        </div>
      </div>

      {tab === "overview" && <div className="branch-overview">
        <div className="branch-diagram">
          <div className="branch-section-label">Representative pattern at rank {selected.spec.rank}</div>
          {representative ? <SatakeDiagram record={representative} /> : <div className="branch-empty">This stratum first appears at a higher rank.</div>}
          <small>The diagram is a concrete representative of this parameter stratum; the inequalities define the full subfamily.</small>
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
          {active && solution && <div className="current-instance-formula">
            <div><span>Selected example</span><code>{parameterSummary(selected)}</code></div>
            <MathFormula latex={`K(u)=${solution.latex}`} />
          </div>}
        </div>
      </div>}

      {tab === "properties" && <BranchProperties solution={solution} />}

      {tab === "examples" && <div className="branch-examples">
        <div className="branch-example-heading"><strong>{examples.length} examples at rank {selected.spec.rank}</strong><span>Select one to materialize its K-matrix and property dossier.</span></div>
        <div>{examples.map((example) => <button key={example.id} className={example.id === selected.id ? "is-active" : ""} onClick={() => onSelect(example.id)}>
          <SatakeDiagram record={example} compact /><span><strong>{parameterSummary(example)}</strong><small>X={example.spec.X.length ? `{${example.spec.X.join(",")}}` : "∅"}</small></span>
        </button>)}</div>
      </div>}

      {tab === "verification" && <div className="branch-verification-panel">
        <div><span>Family-level result</span><strong>{branch.verification.level}</strong><code>{branch.verification.method}</code></div>
        <div><span>Equation</span><strong>{branch.verification.equation}</strong><MathFormula latex={record.reflectionEquation.latex} /></div>
        <div><span>Selected example</span><strong>{solution?.reflectionEquationCertificate?.status ?? "select an available bare example"}</strong>
          <code>{solution?.reflectionEquationCertificate?.certificateId ?? "—"}</code></div>
        <p>The downloaded notebook reconstructs the displayed sparse K- and R-matrices and evaluates the same tensor-leg convention at a reproducible generic numerical sample.</p>
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
  useEffect(() => setOpenBranch(selectedBranch), [selectedBranch]);
  useEffect(() => setRealization("bare"), [record.id]);

  const open = (branchId: string) => {
    setOpenBranch(branchId);
    const first = grouped.get(branchId)?.[0];
    if (first && formulaBranchId(selected, "A.3") !== branchId) onDiagramChange(first.id);
  };

  return <main className="inspector family-workspace">
    <FamilyConfigurator family={family} manifest={manifest} catalogue={catalogue} selected={selected}
      onFileChange={onFileChange} onDiagramChange={onDiagramChange} />
    <section className="family-workspace-heading">
      <div><div className="eyebrow">Formula atlas</div><h2>General and boundary cases</h2><p>Each stratum has its own parameter domain, representative diagram, formula, examples and verification record.</p></div>
      <div className="realization-switch"><span>Realization</span><div>
        <button className={realization === "bare" ? "is-active" : ""} onClick={() => setRealization("bare")}>Bare</button>
        <button className={realization === "dressed" ? "is-active" : ""} onClick={() => setRealization("dressed")}>Dressed</button>
      </div><small><MathFormula latex={affineTypeLatex(record.spec.affineType)} display={false} /> · standard reflection equation</small></div>
    </section>
    <div className="formula-branch-list">
      {branches.map((branch) => <BranchCard key={branch.branchId} branch={branch} examples={grouped.get(branch.branchId) ?? []}
        record={record} selected={selected} active={openBranch === branch.branchId} realization={realization} ambient={catalogue.ambient}
        onOpen={() => open(branch.branchId)} onClose={() => setOpenBranch("")} onSelect={onDiagramChange} />)}
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
