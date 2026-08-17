import { useMemo, useState } from "react";
import type { CatalogueManifest } from "../domain";
import {
  affineTypeLatex,
  familiesForAffineType,
  familyDefinitions,
  isTwistedAffineType,
} from "../lib/families";
import { MathFormula } from "./MathFormula";

interface FamilyLibraryProps {
  manifest: CatalogueManifest | null;
  selectedFileId: string;
  selectedFamilyId: string;
  onSelect: (fileId: string, familyId: string) => void;
}

export function FamilyLibrary({ manifest, selectedFileId, selectedFamilyId, onSelect }: FamilyLibraryProps) {
  const [view, setView] = useState<"type" | "family">("type");
  const [query, setQuery] = useState("");
  const files = manifest?.files ?? [];
  const selectedFile = files.find((file) => file.id === selectedFileId);
  const affineTypes = useMemo(() => Array.from(new Set(files.map((file) => file.affineType))), [files]);
  const normalizedQuery = query.trim().toLowerCase();

  const chooseFile = (affineType: string) => {
    if (selectedFile?.affineType === affineType) return selectedFile.id;
    const choices = files.filter((file) => file.affineType === affineType);
    return choices.at(-1)?.id ?? choices[0]?.id ?? "";
  };

  const matches = (familyId: string, affineType: string) => !normalizedQuery
    || `${familyId} ${affineType}`.toLowerCase().includes(normalizedQuery);

  const typeSection = (twisted: boolean) => <section className="tree-section" key={String(twisted)}>
    <div className="tree-section-title">{twisted ? "Twisted affine" : "Untwisted affine"}</div>
    {affineTypes.filter((type) => isTwistedAffineType(type) === twisted).map((affineType) => {
      const families = familiesForAffineType(affineType).filter((family) => matches(family.id, affineType));
      if (!families.length) return null;
      const activeType = selectedFile?.affineType === affineType;
      return <details className="type-branch" key={affineType} open={activeType || Boolean(normalizedQuery)}>
        <summary>
          <MathFormula latex={affineTypeLatex(affineType)} display={false} />
          <span>{files.filter((file) => file.affineType === affineType).map((file) => file.rank).join(", ")}</span>
        </summary>
        <div className="family-branch">
          {families.map((family) => <button key={family.id}
            className={activeType && selectedFamilyId === family.id ? "is-active" : ""}
            onClick={() => onSelect(chooseFile(affineType), family.id)}>
            <span>{family.id}</span>
            <small>{family.status === "published" ? "paper formula" : "computational"}</small>
          </button>)}
        </div>
      </details>;
    })}
  </section>;

  const familySection = (twisted: boolean) => <section className="tree-section" key={String(twisted)}>
    <div className="tree-section-title">{twisted ? "Twisted families" : "Untwisted families"}</div>
    <div className="family-index-list">
      {familyDefinitions.filter((family) => isTwistedAffineType(family.affineTypes[0]) === twisted)
        .filter((family) => matches(family.id, family.affineTypes[0]))
        .map((family) => {
          const affineType = family.affineTypes[0];
          const active = selectedFile?.affineType === affineType && selectedFamilyId === family.id;
          return <button key={`${affineType}-${family.id}`} className={active ? "is-active" : ""}
            onClick={() => onSelect(chooseFile(affineType), family.id)}>
            <strong>{family.id}</strong>
            <span><MathFormula latex={affineTypeLatex(affineType)} display={false} /></span>
          </button>;
        })}
    </div>
  </section>;

  return <aside className="sidebar family-library">
    <div className="sidebar-heading"><div className="eyebrow">Family library</div><h1>Generalized Satake diagrams</h1></div>
    <div className="library-mode" aria-label="Library organisation">
      <button className={view === "type" ? "is-active" : ""} onClick={() => setView("type")}>By type</button>
      <button className={view === "family" ? "is-active" : ""} onClick={() => setView("family")}>By family</button>
    </div>
    <label className="field library-search"><span>Find a family</span><input value={query}
      onChange={(event) => setQuery(event.target.value)} placeholder="C.1, twisted, A(1)…" /></label>
    <nav className="family-tree" aria-label="K-matrix family library">
      {view === "type" ? [typeSection(false), typeSection(true)] : [familySection(false), familySection(true)]}
    </nav>
  </aside>;
}
