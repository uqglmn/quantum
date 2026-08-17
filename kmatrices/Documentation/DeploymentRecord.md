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

## QSP and ambient R-matrix increment — 2026-08-17

- frontend: `0.3.0`;
- QREKMatrices engine: `0.12.0`;
- catalogue schema: `1.1.0`;
- added reusable `QSPPresentationData`, `AmbientRMatrixData`, and
  `ReflectionEquationData` package APIs;
- exported instantiated QSP generator presentations for all 392 diagrams;
- exported 23 shared representation and ambient R-matrix formula records,
  covering twisted and untwisted catalogues;
- bound every reflection-equation record to its ambient R-matrix convention;
- extended JSON and TeX research bundles with QSP, R, and reflection data.

Validation includes 60 Wolfram tests, 23 schema-valid catalogues, four
frontend tests, a production build, cross-catalogue identifier checks, and a
scripted browser walkthrough of the quadratic twisted R-matrix panel.

## Sparse tensor and R-matrix increment — 2026-08-17

- frontend: `0.4.0`;
- QREKMatrices engine: `0.13.0`;
- catalogue schema: `1.2.0`;
- added sparse `AmbientRMatrix` materialization for every supported untwisted
  and twisted affine presentation;
- added explicit squared-crossing-parameter conventions, including both
  quadratic twisted families;
- added `ReflectionEquationResidual` and `VerifyReflectionEquation` APIs;
- corrected the displayed transposed equation to the source convention with
  `R(1/(uv))^(t_1)`;
- added formula/sparse/provenance views and JSON export for ambient R-matrices.

Validation includes 64 Wolfram tests, exact regularity for all nine series,
exact rational samples of unitarity and Yang--Baxter in all nine series, 23
schema-valid catalogues, four frontend tests, and a production build.

## Exact type-A reflection certificates — 2026-08-17

- frontend: `0.5.0`;
- QREKMatrices engine: `0.14.0`;
- catalogue schema: `1.3.0`;
- fixed spectral substitution in sparse K-matrices before forming `K_2(v)`;
- added reusable `ReflectionEquationCertificate` records with exact residual
  diagnostics, assumptions, conventions, engine version, and provenance;
- certified all 55 currently computable untwisted type-A solutions in ranks
  2--4; eight diagrams lacking sufficient classification parameters remain
  correctly labelled `notComputed`;
- added per-solution certificate inspection and aggregate verification status
  to the explorer.

Validation for this increment includes 65 Wolfram tests, schema validation of
all 23 generated catalogues, four frontend unit tests, and the production
build.

## Untwisted classical reflection certification — 2026-08-17

- frontend: `0.6.0`;
- QREKMatrices engine: `0.15.0`;
- extended exact symbolic reflection-equation certification from type A to all
  exported untwisted B/C/D solutions;
- added collision-checked symbolic-matrix caching during catalogue export;
- generated 206 untwisted certificates: 205 verified and one failed;
- identified the failure as the structurally proposed low-rank D.2 candidate
  `(l,r)=(2,3)` for `X={0,1}`, `tau=(3 4)` in D4(1), which is outside the
  source table's D.2 admissibility range; its D.1 alternative verifies;
- changed mixed candidate outcomes from a misleading diagram-level failure to
  an explicit conditional aggregate, while retaining both certificates.

Validation for this increment includes 68 Wolfram tests, all 206 exact
certificate computations, schema validation of 23 catalogues, four frontend
tests, and the production build.

## Family-first workbench — 2026-08-17

- frontend: `0.7.0`;
- replaced the flat type/rank dropdown and diagram thumbnail list with a
  collapsible library browsable by affine type or K-matrix family;
- added rank and family-parameter controls backed only by catalogue-valid
  instances, with C.1 as the first theorem-level pilot;
- separated the coideal regime from bare, dressed, and transported solution
  realisations;
- split the K-matrix presentation into the general family formula and the
  explicit matrix for the current diagram;
- revised SVG diagrams toward the preprint convention: small labelled nodes,
  restrained line weights, and grey solid double-headed tau arrows;
- added stable, shareable URL state for type, rank, family, and diagram.

Validation for this increment includes eight frontend unit tests, schema
validation of all 23 generated catalogues, a production build, and a headless
browser visual check at desktop width.

## Engine-owned family content — 2026-08-17

- frontend: `0.8.0`;
- QREKMatrices engine: `0.16.0`;
- catalogue schema: `1.4.0`;
- added reusable `KMatrixFamilies` and `KMatrixFamilyData` package APIs;
- made family records and diagram-to-family memberships first-class catalogue
  data instead of frontend-only knowledge;
- transcribed structured general formulas, assumptions, parameter domains,
  branch constraints, and manuscript anchors for A.1--A.4 and C.1;
- created extensible, provenance-bearing records for every remaining twisted
  and untwisted family;
- made exported engine content authoritative in the family workbench while
  retaining the former registry as a backwards-compatibility fallback.

Validation for this increment includes 69 Wolfram tests, nine frontend unit
tests, schema validation of all 23 generated catalogues, and a production
build.

## C.1 scientific dossier — 2026-08-17

- frontend: `0.9.0`;
- QREKMatrices engine: `0.17.0`;
- catalogue schema: `1.5.0`;
- added reusable `KMatrixRealizationData` and `KMatrixPropertyData` APIs;
- implemented the generic C.1 non-quasistandard formula from
  `Res:C1-nstd`, including exact specialization to the quasistandard matrix at
  `nu^2=-1`;
- materialized the admissible symplectic diagonal dressing
  `G(omega)^(-1) K(u) G(omega)` with an inspectable transformation record;
- exported typed spectra with multiplicities, characteristic and generic
  minimal identities, determinant and rank loci, factorization, regularity,
  and boundary unitarity;
- added exact/source/conditional verification states, assumptions, engine
  receipts, and manuscript anchors to every property;
- replaced the properties placeholder and dressed-matrix notice with working
  dossier and matrix views, including JSON and TeX exports.

Validation for this increment includes 71 Wolfram tests, nine frontend unit
tests, schema validation of all 23 generated catalogues, cross-record checks,
and a production build.

## Rank-six classical catalogue and twisted dossiers — 2026-08-17

- frontend: `1.0.0`;
- QREKMatrices engine: `0.19.0`;
- expanded the local static catalogue to all nine supported affine
  presentations through rank six, yielding 41 indexes and 1,095 diagram
  details;
- migrated structured formulas and source anchors for all eleven twisted
  families and added eight-part property dossiers for their computable main and
  generic non-quasistandard solutions;
- retained the unfinished C*.4 spectral block as an explicit unavailable
  capability while exactly verifying its regularity and unitarity identities;
- materialized canonical diagonal dressings for twisted families and explicit
  diagram-automorphism transport chains for non-representative type-A diagrams;
- added orphan-aware semantic validation, including computation-status,
  property-completeness, and reflection-evidence summaries;
- kept exact bulk tensor certification capped at rank three and used
  source-identity evidence above that threshold to keep the static build
  reproducible.
- retained characteristic and minimal identities as exact factored spectral
  products, reducing the rank-six static catalogue from 6.7 GB to about 260 MB
  and the largest detail from roughly 130 MB to below 700 KB.

Validation for this increment includes 86 Wolfram tests, nine frontend tests,
schema and semantic validation of all 41 catalogues and 1,095 details, and the
production build. This increment is the rank-six public release.
