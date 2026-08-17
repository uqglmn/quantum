# Deployment record

## Initial public release — 2026-08-17

- repository: <https://github.com/uqglmn/quantum>
- project source: <https://github.com/uqglmn/quantum/tree/main/kmatrices>
- project index: <https://uqglmn.github.io/quantum/>
- K-matrices explorer: <https://uqglmn.github.io/quantum/kmatrices/>
- source branch: `main`
- publication branch: `gh-pages`
- QREKMatrices engine: `0.11.0`
- catalogue schema: `1.0.0`

The public repository is a monorepo so future projects can occupy additional
top-level directories and be published under matching URL paths. The first
release includes the maintained package, tests, schemas, documentation,
generated catalogue, and frontend. Historical working notebooks and the local
reference archive were deliberately not published.

Release checks:

- 57 Wolfram tests passed;
- 23 catalogue files validated against JSON Schema;
- 392 generalized Satake diagram records exported;
- 248 direct and 189 candidate K-matrix solutions exported;
- production TypeScript/Vite build passed;
- npm production audit reported zero vulnerabilities;
- public index, explorer, and manifest returned successfully over HTTPS;
- the populated explorer was rendered in a headless browser.

The validated central Actions workflow is stored at
`infrastructure/pages-workflow.yml` in the public monorepo. The OAuth token
used for the initial deployment did not have GitHub's `workflow` scope, so the
first release was published directly from `gh-pages`. Once workflow scope is
granted, install the template as `.github/workflows/pages.yml` to automate
validation and deployment from `main`.

## Scientific interface increment — 2026-08-17

- frontend: `0.2.0`;
- QREKMatrices engine: `0.11.1`;
- added explicit candidate-family selection for ambiguous diagrams;
- added self-hosted KaTeX rendering for QSP, K-matrix, and reflection formulas;
- added safe-AST sparse-entry rendering;
- added downloadable JSON research bundles and LaTeX documents;
- added engine, realization, transformation-chain, and source provenance views;
- removed private Wolfram contexts from all 437 exported solution LaTeX strings.

Validation for this increment includes four frontend unit tests, the 57-test
Wolfram suite, schema validation, production build, and scripted browser
interaction that selects the `B.2` candidate of an ambiguous `B.1/B.2` record.
