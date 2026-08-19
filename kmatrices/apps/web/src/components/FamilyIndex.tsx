import type { ManifestFamilyRecord } from "../domain";
import { SatakeMiniature } from "./SatakeSchematic";
import { MathFormula } from "./MathFormula";
import { PRESENTATIONS, morphologyOf, presentationLatex } from "../lib/presentations";

/**
 * Contents of the atlas: the families, grouped by presentation block.
 * Each entry carries a miniature of its own diagram so the forked, cyclic and
 * alternating families are recognisable by shape alone.
 */
export function FamilyIndex({ families, selected, onSelect }: {
  families: ManifestFamilyRecord[];
  selected: string;
  onSelect: (familyId: string) => void;
}) {
  return <nav className="index" aria-label="Family index">
    <div className="index-title">Families · 9 presentations</div>
    {PRESENTATIONS.map((presentation) => {
      const members = families.filter((family) => family.affineTypes.includes(presentation.affineType));
      if (!members.length) return null;
      return <section className="index-group" key={presentation.id}>
        <div className="index-group-head">
          <span className="pres-badge">{presentation.id}</span>
          <MathFormula latex={presentationLatex(presentation.affineType)} display={false} />
        </div>
        {members.map((family) => {
          const variant = family.schematic?.[0];
          const active = family.familyId === selected;
          return <button key={family.familyId} type="button"
            className={`index-item${active ? " is-active" : ""}`}
            aria-current={active ? "true" : undefined}
            onClick={() => onSelect(family.familyId)}>
            <span className="index-item-head">
              <span className="index-name">{family.familyId}</span>
              <span className="index-morph">{morphologyOf(family.familyId)}</span>
            </span>
            {variant
              ? <SatakeMiniature variant={variant} />
              : <span className="index-noshape">no schematic</span>}
          </button>;
        })}
      </section>;
    })}
  </nav>;
}
