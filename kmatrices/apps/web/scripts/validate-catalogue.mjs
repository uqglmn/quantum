import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";

const appRoot = resolve(import.meta.dirname, "..");
const projectRoot = resolve(appRoot, "../..");
const catalogueDirectory = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(appRoot, "public/catalogue");
const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));

const [expressionSchema, catalogueSchema, manifestSchema] = await Promise.all([
  readJson(resolve(projectRoot, "Schemas/expression.schema.json")),
  readJson(resolve(projectRoot, "Schemas/catalogue.schema.json")),
  readJson(resolve(projectRoot, "Schemas/manifest.schema.json")),
]);

const ajv = new Ajv2020({ allErrors: true, strict: true });
ajv.addSchema(expressionSchema);
const validateCatalogue = ajv.compile(catalogueSchema);
const validateManifest = ajv.compile(manifestSchema);
const manifest = await readJson(resolve(catalogueDirectory, "manifest.json"));

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
}

if (!process.exitCode) console.log(`Validated ${manifest.files.length} catalogues against schema ${manifest.schemaVersion}.`);
