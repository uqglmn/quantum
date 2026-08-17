import type { Catalogue, CatalogueManifest, DiagramSummary } from "../domain";
import type { FamilyDefinition } from "../lib/families";
import { parameterLabel, parameterValue, recordBelongsToFamily } from "../lib/families";
import { SatakeDiagram } from "./SatakeDiagram";

interface FamilyConfiguratorProps {
  family: FamilyDefinition;
  manifest: CatalogueManifest;
  catalogue: Catalogue;
  selected: DiagramSummary;
  onFileChange: (fileId: string) => void;
  onDiagramChange: (diagramId: string) => void;
}

function recordLabel(record: DiagramSummary) {
  const x = record.spec.X.length ? `{${record.spec.X.join(",")}}` : "∅";
  return `X=${x} · ${record.classification.regime}`;
}

export function FamilyConfigurator({ family, manifest, catalogue, selected, onFileChange, onDiagramChange }: FamilyConfiguratorProps) {
  const rankFiles = manifest.files.filter((file) => file.affineType === catalogue.catalogue.affineType);
  const familyRecords = catalogue.diagrams.filter((record) => recordBelongsToFamily(record, family.id));
  const parameterKeys = family.parameterOrder.filter((key) => familyRecords.some((record) => parameterValue(record, key) !== null));

  const chooseParameter = (key: string, value: string) => {
    const keyIndex = parameterKeys.indexOf(key);
    const priorKeys = parameterKeys.slice(0, keyIndex);
    const laterKeys = parameterKeys.slice(keyIndex + 1);
    const eligible = familyRecords.filter((record) => parameterValue(record, key) === value
      && priorKeys.every((other) => {
        const current = parameterValue(selected, other);
        return current === null || parameterValue(record, other) === current;
      }));
    const match = eligible.find((record) => laterKeys.every((other) => parameterValue(record, other) === parameterValue(selected, other))) ?? eligible[0];
    if (match) onDiagramChange(match.id);
  };

  return <section className="family-configurator" aria-label={`${family.id} family configurator`}>
    <div className="configurator-copy">
      <div className="section-kicker">Family workbench</div>
      <div className="family-title-row"><h2>{family.title}</h2><span className={`family-status family-status--${family.status}`}>{family.status === "published" ? "paper formula" : "computational"}</span></div>
      <p>{family.description}</p>
      <div className="configuration-controls">
        <fieldset><legend>Rank n</legend><div className="choice-row">
          {rankFiles.map((file) => <button key={file.id} className={file.id === catalogue.catalogue.id ? "is-active" : ""}
            onClick={() => onFileChange(file.id)}>{file.rank}</button>)}
        </div></fieldset>
        {parameterKeys.map((key) => {
          const keyIndex = parameterKeys.indexOf(key);
          const priorKeys = parameterKeys.slice(0, keyIndex);
          const eligible = familyRecords.filter((record) => priorKeys.every((other) => parameterValue(record, other) === parameterValue(selected, other)));
          const values = Array.from(new Set(eligible.map((record) => parameterValue(record, key)).filter((value): value is string => value !== null)));
          return <label className="parameter-control" key={key}><span>{parameterLabel(key)}</span>
            <select value={parameterValue(selected, key) ?? ""} onChange={(event) => chooseParameter(key, event.target.value)}>
              {values.map((value) => <option value={value} key={value}>{value}</option>)}
            </select>
          </label>;
        })}
        <label className="parameter-control parameter-control--instance"><span>Diagram instance</span>
          <select value={selected.id} onChange={(event) => onDiagramChange(event.target.value)}>
            {familyRecords.map((record) => <option key={record.id} value={record.id}>{recordLabel(record)}</option>)}
          </select>
        </label>
      </div>
      <div className="validity-line"><span aria-hidden="true">✓</span> Catalogue-valid instance · {familyRecords.length} available at rank {catalogue.catalogue.rank}</div>
    </div>
    <div className="configurator-diagram">
      <div className="diagram-mode-label"><span>Concrete diagram</span><small>paper convention</small></div>
      <SatakeDiagram record={selected} />
    </div>
  </section>;
}
