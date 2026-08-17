# QRE K-matrix platform architecture

This document is the implementation contract for the public generalized
Satake-diagram explorer. The mathematical package remains the source of truth;
the web application is a renderer and client of versioned mathematical data.

## First deployable slice

The first slice supports:

- all diagrams enumerated by `GeneralizedSatakeDiagrams` for exported type/rank
  pairs;
- diagram rendering and selection;
- full classification, candidate-family, regime, and equation metadata;
- first-class family records with parameter domains, branch constraints,
  general formulas, provenance anchors, properties, and stable instance links;
- optional exported catalogue K-matrices in sparse and LaTeX forms;
- instantiated QSP generator presentations and longest-parabolic words;
- one shared, convention-labelled ambient R-matrix formula record per
  representation catalogue;
- reflection-equation records bound to their ambient R-matrix identifiers;
- typed capability flags for property, verification, and remote-compute layers.

Unavailable capabilities remain visible with an honest status. In particular,
source identities, instantiated presentations, and CAS verification
certificates are distinct statuses. Later slices can populate materialized
R-matrices and certificates without changing diagram or solution identity.

## Component boundaries

```text
QREKMatrices paclet
  -> family registry and diagram-to-family memberships
  -> deterministic catalogue exporter
  -> JSON Schema validated artifacts
  -> CatalogueProvider
  -> domain state
  -> diagram/formula/matrix/property renderers

Optional ComputeProvider
  -> API gateway
  -> Wolfram Cloud now
  -> licensed/self-hosted or open backend later
```

The package-owned family registry is authoritative. The UI retains a small
compatibility registry only so older catalogue schemas remain readable; when a
catalogue supplies a family record, its description, parameter domain, formula,
and provenance always win. The UI never imports Wolfram Language source and
never infers mathematical meaning from display LaTeX. It consumes the semantic
expression tree.

## Versions

Three versions are independent and appear in responses:

- `schemaVersion`: compatibility of the JSON contract;
- `engine.version`: the QREKMatrices paclet version;
- deployment/application version: the frontend release.

A schema major-version change requires a new catalogue path such as
`/catalogue/v2/`. Engine upgrades do not require a schema change.

## Identity

Diagram identifiers are canonical functions of affine type, rank, `X`, and
`tau`; they never depend on enumeration order or visual layout. Solution
identifiers add family/regime information. A displayed matrix references its
base solution and an ordered transformation chain. Family records have stable
manuscript identifiers such as `A.3` and `C.1`; each diagram carries explicit
classified or candidate memberships, including its family parameters and any
transport permutation.

Realizations are immutable artifacts linked to a base solution. A dressed
artifact stores the admissible dressing parameters, transformation formula,
materialized matrix, and inherited property dossier. Property records are
semantic objects rather than display strings: they contain an expression tree,
assumptions, optional spectrum with multiplicities, verification method and
residual diagnostics, engine version, and manuscript anchors.

## Extension rules

- New affine type: register Cartan, representation, layout, classifier, and
  formula providers; existing pages consume the new records.
- New representation: register a representation and basis identifier.
- New K- or R-family: register a solution provider and its capability record.
- New property: add a property record and renderer keyed by `kind`.
- New backend: implement `ComputeProvider`; do not change UI components.
- User workspaces: store immutable diagram/solution IDs plus parameter and
  transformation records, not copied formula text.

## Security boundary

Only the restricted expression schema crosses into the browser. Future remote
requests accept enum-valued types, bounded ranks, validated node lists, and a
restricted parameter-expression grammar. Arbitrary Wolfram expressions are
out of scope.

## Deployment environments

- local: static provider and optionally a developer kernel;
- preview: one immutable URL per pull request;
- staging: production schemas with a staging compute endpoint;
- production: content-hashed static assets and a version-pinned compute API.

The static application must degrade gracefully when the compute provider is
unhealthy or absent.
