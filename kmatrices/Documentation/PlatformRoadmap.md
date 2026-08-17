# Scientific platform roadmap

## Product principles

- Treat diagram choice, coideal regime, representation, and matrix realisation
  as separate selections.
- Preserve ambiguity. If `(X, tau)` supports several parameter regimes, show
  every candidate and require an explicit choice.
- Distinguish a proved identity, a symbolic computation under assumptions, a
  numerical check, and an unavailable feature in both data and typography.
- Make every displayed formula downloadable with basis, convention,
  normalization, provenance, engine version, and assumptions.
- Keep the static catalogue useful when all live services are offline.

## Domain model

```text
Affine presentation
  └─ Generalized Satake diagram (X, tau)
      ├─ classification / candidate coideal regimes
      ├─ QSP presentation B_c,s(X,tau)
      └─ representation
          ├─ ambient R-matrix + convention
          └─ K solution family
              ├─ realisation: bare | dressed | transported
              ├─ transformation chain
              ├─ reflection equation
              └─ property records
```

“Non-quasistandard” is a coideal/formula regime, whereas “dressed” is a
realisation of a base solution. The UI may present both in one convenient
control, but storage and computation must not conflate them.

## Increment sequence

### 1. Catalogue explorer — implemented foundation

- all nine classical affine presentations, twisted and untwisted;
- ranks 2–4 where supported, 392 diagram records;
- custom SVG diagrams with black nodes, multiple bonds, arrows, and tau arcs;
- classification, equation, regime, parameter, sparse K, LaTeX, and provenance
  views;
- strict JSON schemas, deterministic IDs, validation, build, and deployment.

### 2. Scientific completeness — in progress

- implemented: explicit QSP generator presentation exporter, including the
  instantiated index sets, longest-parabolic word, quantum involution, torus,
  boundary generators, parameter domain, and source provenance;
- implemented: representation registry and convention-labelled ambient
  R-matrix operator formulas for all exported twisted and untwisted types;
- implemented: sparse ambient R-matrix materialization in the lexicographic
  tensor basis for all nine supported affine presentations;
- implemented: reflection-equation records bound by stable identifier to their
  ambient R-record, including partial-transpose and spectral conventions;
- implemented first certification milestone: exact symbolic tensor-residual
  certificates for every computable untwisted type-A solution in ranks 2--4;
- remaining: expanded inhomogeneous QSP relations and family-specific
  admissibility constraints;
- remaining: convention reconciliation and exact certificate coverage for the
  B/C/D and twisted catalogues;
- implemented: explicit family selector for ambiguous diagrams, with the
  mathematical reason for the ambiguity retained in the interface;
- implemented: self-hosted KaTeX rendering for QSP templates, reflection
  equations, full K-matrices, and safe-AST sparse entries;
- implemented: provenance views and self-describing JSON/LaTeX downloads;
- remaining export formats: Wolfram Language and MatrixMarket.

### 3. Transformations and properties

- parameter editor with symbolic presets and assumptions;
- bare/dressed/transported transformation pipeline with an inspectable history;
- non-quasistandard endpoint selection where formulas are complete;
- eigenvalues and multiplicities;
- characteristic and minimal identities;
- factorization, regularity, boundary unitarity, determinant, and rank loci;
- exact, conditional, and sampled verification badges.

### 4. Compute service

- provider-neutral gateway with synchronous fast jobs and asynchronous heavy
  jobs;
- Wolfram Cloud beta adapter, caching, quotas, telemetry, and circuit breaker;
- reproducible computation receipts containing input hash and engine version;
- optional licensed/self-hosted kernel adapter without frontend changes.

### 5. Community platform

- stable share links and saved workspaces;
- citations, BibTeX, source-page/notebook provenance, and issue links per family;
- reviewed community submissions separated from canonical records;
- accessibility audit, keyboard diagram selection, responsive matrix views, and
  print-ready exports;
- regression gallery and golden mathematical fixtures.

## Release gates

Each new mathematical provider needs unit tests, at least one independently
known fixture, schema validation, explicit conventions, provenance, and a
capability flag. A property is not labelled “verified” merely because a CAS
returned an expression; its assumptions and verification method are part of
the record.
