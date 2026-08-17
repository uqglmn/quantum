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
- ranks through six where supported, 1,095 diagram records in 41 catalogues;
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
- implemented: exact symbolic tensor-residual certificates for all 206
  computable untwisted A/B/C/D solutions in the exported ranks; 205 verify,
  while one source-inadmissible low-rank D.2 candidate is retained as a failed
  audit record beside its verified D.1 alternative;
- remaining: expanded inhomogeneous QSP relations and family-specific
  admissibility constraints;
- remaining: convention reconciliation and exact certificate coverage for the
  twisted catalogues;
- implemented: explicit family selector for ambiguous diagrams, with the
  mathematical reason for the ambiguity retained in the interface;
- implemented: self-hosted KaTeX rendering for QSP templates, reflection
  equations, full K-matrices, and safe-AST sparse entries;
- implemented: provenance views and self-describing JSON/LaTeX downloads;
- implemented for the A.3 formula-atlas slice: self-contained Wolfram Language
  scripts and Mathematica notebooks with K, R, the applicable reflection
  equation, and deterministic numerical verification;
- remaining export format: MatrixMarket; extend Wolfram worksheet actions from
  the A.3 branch component to the shared family component.

### 3. Transformations and properties

- implemented: bare and canonical diagonal dressings for all computable
  classical families, with materialized matrices and inspectable transformation
  records;
- implemented pilot: the generic C.1 non-quasistandard formula with parameter
  `nu`, its separate regime formula, and its exact `nu^2=-1` specialization;
- implemented: spectra and multiplicities, characteristic and generic minimal
  identities, determinant and rank loci, factorization, regularity, boundary
  unitarity, assumptions, provenance, and verification badges for all main
  untwisted and twisted families; C*.4 exposes its unfinished source spectrum
  without guessing the missing coefficients;
- parameter editor with symbolic presets and assumptions;
- implemented: matrix-level dihedral transport for type A, exported as an
  explicit transformation chain and composed with subsequent dressing;
- non-quasistandard endpoint selection where formulas are complete;
- family-specific reduction and singular loci beyond the generic C.1 record;
- sampled verification badges for formulas too expensive for exact export.

### Formula-atlas interface — implemented A.3 vertical slice

- four disjoint arbitrary-rank general/boundary strata encoded by the engine,
  including the
  intersection `l=0, r=floor(t/2)`;
- accordion branch cards with a symbolic general-rank Satake template and
  family formula;
- local Overview, Properties, Examples, and Verification tabs;
- ranks two through six presented only as concrete specializations in the
  Examples tab, with a bare/dressed realization switch and explicit matrices;
- sampled-check badges explicitly distinguished from general-rank statements;
- compact shared disclosure for the QSP presentation, ambient R-matrix, and
  reflection equation;
- reusable data and component boundaries ready to migrate the remaining
  families one at a time.

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
