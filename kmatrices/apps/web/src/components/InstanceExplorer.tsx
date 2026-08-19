import { useEffect, useMemo, useState } from "react";
import type { Catalogue, DiagramRecord, ManifestFamilyRecord, Realization, Solution } from "../domain";
import { staticCatalogueProvider } from "../lib/catalogue";
import { recordBelongsToFamily, parameterLabel } from "../lib/families";
import { formatExpression } from "../lib/expression";
import { SatakeDiagram } from "./SatakeDiagram";
import { FormulaPanel } from "./InstancePanels";

/**
 * A worked instance of the family at one concrete rank. Deliberately secondary:
 * the family and its arbitrary-rank formula are the primary objects.
 */
export function InstanceExplorer({ family }: { family: ManifestFamilyRecord }) {
  const ranks = useMemo(
    () => [...family.catalogues].sort((a, b) => a.rank - b.rank),
    [family.catalogues],
  );
  // A mid-range rank shows the generic stratum rather than a degenerate corner.
  const defaultRank = () => Math.floor(family.catalogues.length / 2);
  const [rankIndex, setRankIndex] = useState(defaultRank);
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null);
  const [diagramId, setDiagramId] = useState("");
  const [detail, setDetail] = useState<DiagramRecord | null>(null);
  const [realization, setRealization] = useState<Realization>("bare");
  const [solutionId, setSolutionId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { setRankIndex(defaultRank()); }, [family.familyId]);

  const target = ranks[Math.min(rankIndex, ranks.length - 1)];

  useEffect(() => {
    if (!target) return;
    const controller = new AbortController();
    setCatalogue(null); setDetail(null); setError("");
    staticCatalogueProvider.catalogue(target.path, controller.signal)
      .then((value) => {
        setCatalogue(value);
        const members = value.diagrams.filter((r) => recordBelongsToFamily(r, family.familyId));
        // Prefer an instance that actually carries a matrix over a bare classification.
        const computed = members.find((r) => r.capabilities?.kMatrix);
        setDiagramId((computed ?? members[0])?.id ?? "");
      })
      .catch((reason: Error) => { if (reason.name !== "AbortError") setError(reason.message); });
    return () => controller.abort();
  }, [target?.path, family.familyId]);

  const members = useMemo(
    () => catalogue?.diagrams.filter((r) => recordBelongsToFamily(r, family.familyId)) ?? [],
    [catalogue, family.familyId],
  );
  const summary = members.find((r) => r.id === diagramId) ?? members[0];

  useEffect(() => {
    if (!summary || !catalogue) { setDetail(null); return; }
    const controller = new AbortController();
    setDetail(null);
    staticCatalogueProvider.diagram(summary.detailPath, controller.signal)
      .then((value) => { setDetail(value.diagram); setRealization("bare"); })
      .catch((reason: Error) => { if (reason.name !== "AbortError") setError(reason.message); });
    return () => controller.abort();
  }, [summary?.detailPath, catalogue?.catalogue.id]);

  const solutions = detail
    ? ([detail.computation.solution, ...detail.computation.candidates].filter(Boolean) as Solution[])
    : [];
  const selected = solutions.find((s) => s.solutionId === solutionId) ?? solutions[0];

  if (!ranks.length) return <p className="muted-note">No exported catalogue contains this family.</p>;

  return <div className="instance">
    <div className="instance-controls">
      <label className="control">
        <span>Rank</span>
        <select value={rankIndex} onChange={(event) => setRankIndex(Number(event.target.value))}>
          {ranks.map((entry, index) => <option key={entry.catalogueId} value={index}>n = {entry.rank}</option>)}
        </select>
      </label>
      <label className="control control--wide">
        <span>Diagram</span>
        <select value={summary?.id ?? ""} onChange={(event) => setDiagramId(event.target.value)}
          disabled={!members.length}>
          {members.map((record) => <option key={record.id} value={record.id}>
            X = {record.spec.X.length ? `{${record.spec.X.join(",")}}` : "∅"}
            {Object.entries(record.classification.parameters).length
              ? ` · ${Object.entries(record.classification.parameters)
                  .map(([key, value]) => `${parameterLabel(key)}=${formatExpression(value)}`).join(", ")}`
              : ""}
          </option>)}
        </select>
      </label>
      {solutions.length > 1 && <label className="control">
        <span>Candidate</span>
        <select value={selected?.solutionId ?? ""} onChange={(event) => setSolutionId(event.target.value)}>
          {solutions.map((s) => <option key={s.solutionId} value={s.solutionId}>{s.family}</option>)}
        </select>
      </label>}
      <div className="segmented segmented--compact" aria-label="Realisation">
        {(["bare", "dressed", "transported"] as Realization[]).map((mode) => <button key={mode}
          className={realization === mode ? "is-active" : ""} onClick={() => setRealization(mode)}>
          {mode[0].toUpperCase() + mode.slice(1)}
        </button>)}
      </div>
    </div>

    {error && <p className="muted-note">{error}</p>}
    {!catalogue && !error && <p className="muted-note">Loading catalogue…</p>}

    {summary && <div className="instance-diagram"><SatakeDiagram record={summary} /></div>}

    {detail && catalogue ? <>
      <dl className="kv kv--inline">
        <div><dt>rank</dt><dd>n = {detail.spec.rank}</dd></div>
        <div><dt>X</dt><dd>{detail.spec.X.length ? `{${detail.spec.X.join(", ")}}` : "∅"}</dd></div>
        <div><dt>τ</dt><dd>[{detail.spec.tau.join(", ")}]</dd></div>
        <div><dt>status</dt><dd>{detail.computation.status}</dd></div>
      </dl>
      <FormulaPanel record={detail} realization={realization} engine={catalogue.engine}
        ambient={catalogue.ambient} solutions={solutions} selected={selected}
        onSelect={setSolutionId} />
    </> : catalogue && !error ? <p className="muted-note">Loading diagram…</p> : null}
  </div>;
}
