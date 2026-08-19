import { useEffect, useMemo, useState } from "react";
import type { CatalogueManifest } from "./domain";
import { staticCatalogueProvider } from "./lib/catalogue";
import { FamilyIndex } from "./components/FamilyIndex";
import { FamilyPage } from "./components/FamilyPage";
import { PRESENTATIONS } from "./lib/presentations";

function familyFromLocation(): string {
  const hash = decodeURIComponent(window.location.hash.replace(/^#/, ""));
  if (hash) return hash;
  return new URLSearchParams(window.location.search).get("family") ?? "";
}

export function App() {
  const [manifest, setManifest] = useState<CatalogueManifest | null>(null);
  const [familyId, setFamilyId] = useState(familyFromLocation);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    staticCatalogueProvider.manifest(controller.signal)
      .then((value) => {
        setManifest(value);
        setFamilyId((current) => {
          const requested = current || familyFromLocation();
          return value.families?.some((family) => family.familyId === requested)
            ? requested
            : value.families?.[0]?.familyId ?? "";
        });
      })
      .catch((reason: Error) => { if (reason.name !== "AbortError") setError(reason.message); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      const next = familyFromLocation();
      if (next) setFamilyId(next);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (!familyId) return;
    const target = `#${encodeURIComponent(familyId)}`;
    if (window.location.hash !== target) window.history.replaceState(null, "", target);
  }, [familyId]);

  // Present families in presentation order so the index and the URL agree.
  const families = useMemo(() => {
    const all = manifest?.families ?? [];
    const rank = new Map(PRESENTATIONS.map((presentation, index) => [presentation.affineType, index]));
    return [...all].sort((a, b) => {
      const byPresentation = (rank.get(a.affineTypes[0]) ?? 99) - (rank.get(b.affineTypes[0]) ?? 99);
      return byPresentation !== 0 ? byPresentation : a.familyId.localeCompare(b.familyId);
    });
  }, [manifest]);

  const family = families.find((candidate) => candidate.familyId === familyId);

  const selectFamily = (next: string) => {
    setFamilyId(next);
    window.scrollTo({ top: 0 });
  };

  return <div className="app">
    <header className="topbar">
      <div className="wordmark">K<span aria-hidden="true">·</span>Atlas</div>
      <span className="topbar-sub">K-matrices of generalized quantum symmetric pairs</span>
      <div className="topbar-right">
        {manifest ? `${families.length} families · engine ${manifest.engine.version} · schema ${manifest.schemaVersion}` : "loading"}
      </div>
    </header>
    <div className="shell">
      {manifest && <FamilyIndex families={families} selected={familyId} onSelect={selectFamily} />}
      {error
        ? <main className="state-panel">
            <h2>Catalogue unavailable</h2>
            <p>{error}</p>
            <p>Run <code>math -script Scripts/ExportWebCatalogue.wls</code> before starting the app.</p>
          </main>
        : family
          ? <FamilyPage family={family} engineVersion={manifest?.engine.version ?? ""} />
          : <main className="state-panel"><p>Loading the family atlas…</p></main>}
    </div>
  </div>;
}
