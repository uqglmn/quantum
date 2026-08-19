import { readFile, readdir } from "node:fs/promises";
import { relative, resolve } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";

const appRoot = resolve(import.meta.dirname, "..");
const projectRoot = resolve(appRoot, "../..");
const catalogueDirectory = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(appRoot, "public/catalogue");
const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));

const [expressionSchema, catalogueSchema, diagramSchema, manifestSchema] = await Promise.all([
  readJson(resolve(projectRoot, "Schemas/expression.schema.json")),
  readJson(resolve(projectRoot, "Schemas/catalogue.schema.json")),
  readJson(resolve(projectRoot, "Schemas/diagram.schema.json")),
  readJson(resolve(projectRoot, "Schemas/manifest.schema.json")),
]);

const ajv = new Ajv2020({ allErrors: true, strict: true });
ajv.addSchema(expressionSchema);
ajv.addSchema(catalogueSchema);
const validateCatalogue = ajv.getSchema(catalogueSchema.$id);
const validateDiagram = ajv.compile(diagramSchema);
const validateManifest = ajv.compile(manifestSchema);
const manifest = await readJson(resolve(catalogueDirectory, "manifest.json"));
const expectedDetailPaths = new Set();
const statusCounts = new Map();
const certificateCounts = new Map();
const requiredPropertyKinds = [
  "eigenvalues",
  "characteristicIdentity",
  "minimalIdentity",
  "determinant",
  "factorization",
  "rankLoci",
  "regularity",
  "unitarity",
];
let solutionCount = 0;

const increment = (counts, key) => counts.set(key, (counts.get(key) ?? 0) + 1);
const walkJson = async (directory) => {
  const paths = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) paths.push(...await walkJson(path));
    else if (entry.name.endsWith(".json")) paths.push(path);
  }
  return paths;
};

if (!validateManifest(manifest)) {
  console.error(validateManifest.errors);
  process.exitCode = 1;
}

const diskFiles = new Set((await readdir(catalogueDirectory)).filter((name) => name.endsWith(".json")));
for (const entry of manifest.files) {
  if (!diskFiles.has(entry.path)) throw new Error(`Manifest file is missing: ${entry.path}`);
  const data = await readJson(resolve(catalogueDirectory, entry.path));
  if (!validateCatalogue(data)) {
    console.error(`${entry.path} failed schema validation`, validateCatalogue.errors);
    process.exitCode = 1;
  }
  if (data.summary.diagramCount !== data.diagrams.length || data.diagrams.length !== entry.diagramCount) {
    throw new Error(`Diagram count mismatch in ${entry.path}`);
  }
  if (new Set(data.diagrams.map(({ id }) => id)).size !== data.diagrams.length) {
    throw new Error(`Duplicate diagram IDs in ${entry.path}`);
  }
  if (data.summary.detailCount !== data.diagrams.length || entry.detailCount !== data.diagrams.length) {
    throw new Error(`Diagram detail count mismatch in ${entry.path}`);
  }
  for (const summary of data.diagrams) {
    expectedDetailPaths.add(summary.detailPath);
    const detail = await readJson(resolve(catalogueDirectory, summary.detailPath));
    if (!validateDiagram(detail)) {
      console.error(`${summary.detailPath} failed schema validation`, validateDiagram.errors);
      process.exitCode = 1;
    }
    if (detail.catalogue.id !== data.catalogue.id || detail.diagram.id !== summary.id) {
      throw new Error(`Diagram detail identity mismatch in ${summary.detailPath}`);
    }

    const computation = detail.diagram.computation;
    increment(statusCounts, computation.status);
    if (computation.status === "ParameterExtractionFailed") {
      throw new Error(`Unresolved family parameters in ${summary.detailPath}`);
    }

    const solutions = [computation.solution, ...(computation.candidates ?? [])]
      .filter((solution) => solution?.properties?.length > 0);
    for (const solution of solutions) {
      solutionCount += 1;
      const kinds = solution.properties.map(({ kind }) => kind);
      if (kinds.length !== requiredPropertyKinds.length ||
          requiredPropertyKinds.some((kind) => !kinds.includes(kind))) {
        throw new Error(`Incomplete property dossier for ${solution.solutionId} in ${summary.detailPath}`);
      }
      const certificateStatus = solution.reflectionEquationCertificate?.status ?? "sourceIdentity";
      increment(certificateCounts, certificateStatus);
    }
  }
}


// --- arbitrary-rank diagram schematics -------------------------------------
const nodesOf = (tokens = []) => tokens.filter((token) => token.kind === "node");
let schematicVariantCount = 0;
const layoutCounts = new Map();
for (const family of manifest.families ?? []) {
  for (const variant of family.schematic ?? []) {
    schematicVariantCount += 1;
    increment(layoutCounts, variant.layout);
    const primary = variant.layout === "folded" ? variant.top
      : variant.layout === "cycle" ? variant.ring : variant.row;
    if (!primary?.length) {
      throw new Error(`Empty schematic row for ${family.familyId}/${variant.variantId}`);
    }
    const nodeCount = nodesOf(primary).length;
    if (variant.layout === "folded") {
      if (nodesOf(variant.top).length !== nodesOf(variant.bottom).length) {
        throw new Error(`Folded schematic rows differ in length for ${family.familyId}/${variant.variantId}`);
      }
    }
    if (variant.layout === "cycle") {
      // a ring must close: one link per node
      const linkCount = primary.filter((token) => token.kind === "link").length;
      if (linkCount !== nodeCount) {
        throw new Error(`Cyclic schematic ${family.familyId}/${variant.variantId} does not close`);
      }
    }
    for (const brace of variant.braces ?? []) {
      for (const anchor of [brace.from, brace.to]) {
        if (typeof anchor === "number") {
          if (anchor < 0 || anchor >= nodeCount) {
            throw new Error(`Brace anchor ${anchor} out of range in ${family.familyId}/${variant.variantId}`);
          }
        } else if (!["cap", "capL", "capR"].includes(anchor)) {
          throw new Error(`Unknown brace anchor "${anchor}" in ${family.familyId}/${variant.variantId}`);
        }
      }
    }
  }
}

const actualDetailPaths = (await walkJson(resolve(catalogueDirectory, "details")))
  .map((path) => relative(catalogueDirectory, path));
const orphanDetails = actualDetailPaths.filter((path) => !expectedDetailPaths.has(path));
if (orphanDetails.length > 0) {
  throw new Error(`${orphanDetails.length} unreferenced diagram details found; first: ${orphanDetails[0]}`);
}

if (!process.exitCode) {
  const details = manifest.files.reduce((sum, entry) => sum + entry.detailCount, 0);
  console.log(`Validated ${manifest.files.length} catalogue indexes and ${details} diagram details against schema ${manifest.schemaVersion}.`);
  console.log(`Computation statuses: ${JSON.stringify(Object.fromEntries([...statusCounts].sort()))}`);
  console.log(`Family index: ${(manifest.families ?? []).length} families, ${schematicVariantCount} diagram schematics ${JSON.stringify(Object.fromEntries([...layoutCounts].sort()))}.`);
  console.log(`Complete solution dossiers: ${solutionCount}; reflection evidence: ${JSON.stringify(Object.fromEntries([...certificateCounts].sort()))}.`);
}
