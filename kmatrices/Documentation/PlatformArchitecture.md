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
- optional exported catalogue K-matrices in sparse and LaTeX forms;
- typed capability flags for QSP, R-matrix, property, and remote-compute layers.

Unavailable capabilities remain visible with an honest status. Later slices
will populate them without changing the diagram or solution records.

## Component boundaries

```text
QREKMatrices paclet
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

The UI never imports Wolfram Language source and never infers mathematical
meaning from display LaTeX. It consumes the semantic expression tree.

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
base solution and an ordered transformation chain.

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
