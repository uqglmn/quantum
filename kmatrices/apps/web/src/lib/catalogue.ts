import type { Catalogue, CatalogueManifest } from "../domain";

const catalogueRoot = `${import.meta.env.BASE_URL}catalogue/`;

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, { signal });
  if (!response.ok) {
    throw new Error(`Catalogue request failed (${response.status}) for ${path}`);
  }
  return response.json() as Promise<T>;
}

export interface CatalogueProvider {
  manifest(signal?: AbortSignal): Promise<CatalogueManifest>;
  catalogue(path: string, signal?: AbortSignal): Promise<Catalogue>;
}

export const staticCatalogueProvider: CatalogueProvider = {
  manifest: (signal) => getJson<CatalogueManifest>(`${catalogueRoot}manifest.json`, signal),
  catalogue: (path, signal) => getJson<Catalogue>(`${catalogueRoot}${path}`, signal),
};
