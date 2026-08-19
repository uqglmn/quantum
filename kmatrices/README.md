# QREKMatrices

`QREKMatrices` is a Wolfram Language package for computing vector-representation
K-matrices from generalized Satake diagrams. It follows the conventions of the
qRE preprint (arXiv:1602.08471) and the unfinished qRE_II computations in this
repository.

The computational route is

```text
affine type + (X,tau)
        -> validated generalized Satake diagram
        -> vector evaluation representation
        -> represented quantum-pair generators B_{c,s}(X,tau)
        -> linear boundary-intertwiner system
        -> K(u)
```

Both untwisted and twisted classical affine presentations are supported:

```wl
AffineTypes[]
(* {"A(1)", "B(1)", "C(1)", "D(1)",
     "A2n-1(2)", "A2n-1(2)T", "A2n(2)", "A2n(2)T", "Dn+1(2)"} *)
```

The suffix `T` denotes the reversed/transposed Cartan presentation used in
qRE_II, not the boundary equation. The aliases `"DC"`, `"CD"`, `"CB"`,
`"BC"`, and `"BB"` from its notebooks are also accepted.

## Loading

From the repository root:

```wl
Get["Kernel/QREKMatrices.wl"]
```

The repository is also laid out as a paclet, with metadata in `PacletInfo.wl`.

## Generalized Satake diagrams

Nodes and permutations use the zero-based convention `0,...,n`.

```wl
d = CreateSatakeDiagram[
  "C(1)",
  3,
  {1, 2},
  Automatic
];

SatakeDiagramData[d, "CartanMatrix"]
SatakeDiagramQ[d]

all = GeneralizedSatakeDiagrams["C(1)", 3];

classification = ClassifySatakeDiagram[d];
classification["CandidateFamilies"]
BoundaryEquationType[d]
```

`GeneralizedSatakeDiagrams[type,n]` enumerates all valid pairs at fixed rank,
not merely one representative per diagram-automorphism orbit. Validation checks
involutivity, preservation of the Cartan matrix and `X`, the condition
`tau|X == -w_X`, finiteness of the parabolic subsystem, and the defining
generalized-Satake exclusion.

Type A diagrams are classified uniquely into A.1--A.4, including automatic
extraction of the A.3 parameters `l`, `r`, and `t`. For B/C/D and twisted
types, classification uses the τ-orbits in the white nodes: consecutive orbit
representatives give a plain family, alternating representatives give an
alternating family, and end-pairing involutions give a parallel family. The
single-orbit case is genuinely both plain and alternating, so the result then
contains both `"CandidateFamilies"`. The classifier also identifies the
non-quasistandard three-white plain regime and the exceptional D.3 orbit.
For the forked B*/tB* presentations it enforces the source-table parity of the
fork involution. Representatives needing a fork exchange or another diagram
automorphism are reported explicitly. `KMatrix` derives the corresponding
representation intertwiner and transports the representative formula instead
of treating the same matrix as though no exchange occurred.

## Batch computation

`KMatrixTable` is the reusable all-diagrams entry point. It enumerates the
requested type and rank and preserves one output record per generalized Satake
diagram:

```wl
rows = KMatrixTable["A2n-1(2)", 3, u,
  "QuantumParameter" -> q];

Counts[Lookup[rows, "Status"]]
Dataset[rows]
```

Each record contains `"Diagram"`, `"Family"`, classification parameters, the
full `"Classification"`, a `"Status"`, and the `"Result"`. A result is either
the K-matrix association, a `"MultipleCandidates"`/`"CandidateResults"`
association, or a structured `Failure`, so ambiguous, non-quasistandard, and
unsupported exceptional cases are never dropped. `"CandidateResults"` means
that only some of the named alternatives are currently computable. To obtain
only matrices that can currently be computed automatically:

```wl
computed = KMatrixTable["C(1)", 4, u,
  "ComputedOnly" -> True];
```

All ordinary `KMatrix` options are forwarded, including quantum/formula
parameters, dressing, equation selection, and explicit coideal data.

When one diagram supports genuinely different coideal regimes, the package
does not choose one silently. It returns every named alternative:

```wl
d = CreateSatakeDiagram["A2n-1(2)", 3, {0, 1, 3}];
candidates = KMatrixCandidates[d, u];
Lookup[candidates, "Family"]
(* {"B*.1", "B*.2"} *)
```

Each candidate contains its family, classification parameters, status, and
complete K-matrix result. Set `"ResolveAmbiguities" -> False` in
`KMatrixTable` to retain the lower-level `AmbiguousKMatrixFamily` failure
instead.

## Diagram-automorphism transport

The vector-representation matrix implementing an affine Dynkin automorphism is
available directly:

```wl
sigma = {1, 0, 2, 3};
automorphism = DiagramAutomorphismIntertwiner[
  "A2n-1(2)", 3, sigma, z, q];
G = automorphism["Intertwiner"];
```

It is derived from the Chevalley-generator conjugation equations, not from a
hard-coded basis permutation. If `sigma.d` is a catalogued representative,
automatic transport uses

```text
K_d(u) = G_sigma(eta/u)^(-1) K_{sigma.d}(u) G_sigma(eta u).
```

The returned K-matrix association records the permutation, spectral
intertwiner, scaling parameter, and transport provenance. Both left- and
right-fork exchanges are covered and verified against the represented boundary
equations.

## Vector representations

```wl
rep = VectorRepresentation["A2n(2)", 2, z, q];

rep["BasisLabels"]
rep["E"][0]
rep["F"][0]
rep["K"][0]

VerifyVectorRepresentation[rep]
VerifyVectorRepresentation[DualVectorRepresentation[rep]]
```

`VerifyVectorRepresentation` checks the Cartan, Chevalley commutator, and
quantum Serre relations. `DualVectorRepresentation` implements
`a |-> Transpose[rho(S(a))]`, needed for the antipode--transpose boundary
equation.

## Computing a K-matrix from a diagram

Supply compatible coideal parameters `c_i`, optional `s_i`, and the scaling
parameter `eta`. For the all-white untwisted diagram of type A2, the automatic
equation selector finds the antipode--transpose equation:

```wl
d = CreateSatakeDiagram["A(1)", 2, {}];

result = KMatrix[
  d, u,
  "QuantumParameter" -> 2,
  "CParameters" -> <|0 -> 1, 1 -> 1, 2 -> 1|>
];

result["Equation"]
(* "Transposed" *)

Normal[First[result["Basis"]]]
(* -IdentityMatrix[3] *)
```

An ordinary-equation example is the all-white A1 diagram:

```wl
d = CreateSatakeDiagram["A(1)", 1, {}];

result = KMatrix[
  d, u,
  "QuantumParameter" -> 2,
  "CParameters" -> <|0 -> 1/2, 1 -> 1/2|>,
  "NormalizeAt" -> 1
];

result["Equation"]
result["NormalizedKMatrix"]
```

For direct access to the intermediate objects:

```wl
generators = RepresentedQPGenerators[d, u, q, c, s];
result = DeriveKMatrix[d, u, q, c, s, "Equation" -> Automatic];
```

`"Equation"` may be `"Standard"`, `"Transposed"`, or `Automatic`. Automatic
tries both conventions when needed and prefers a one-dimensional solution
space. The returned association records the equation used, represented
generator names, a nullspace basis, and a generic linear combination.

The coideal parameters are mathematically constrained. A result with
`"Dimension" -> 0` can therefore mean that the supplied `c`, `s`, or `eta`
are incompatible with the diagram; automatic solution of those nonlinear
parameter constraints is not yet implemented.

For bare A.1, A.2, and A.4 at `eta=1`, source assignments are encoded directly.
For a uniquely classified main family, the same function can instead infer
compatible `c_i,s_i` from the catalogued K-matrix and represented boundary
equation:

```wl
parameterData = CanonicalCoidealParameters[d, q];

VerifyKMatrix[
  result["KMatrix"], d, u, q,
  parameterData["CParameters"],
  parameterData["SParameters"],
  "Equation" -> parameterData["Equation"]
]
```

Boundary parameters used by a closed formula can be supplied during inference:

```wl
parameterData = CanonicalCoidealParameters[
  d, 2,
  "Parameters" -> <|"Lambda" -> 3|>
];
```

The lower-level `InferCoidealParameters[K,d,u,q]` exposes the equations, all
solutions, free variables, and node-indexed parameter associations. Solutions
that depend on the spectral parameter are rejected. This inference route is
independently verified on representative cases of B.1/B.2, C.1/C.2/C.4, and
D.1/D.2/D.4, and on representatives of every twisted catalogue family. It is
also an independent check of formula/convention compatibility: in particular,
it detects transcription differences between the qRE_II draft prose and its
executable notebooks.

## Low-level boundary solver

Given any two lists of represented generators, solve
`K.left[[i]] == right[[i]].K` simultaneously:

```wl
left = {DiagonalMatrix[{1, 2}]};
solution = SolveBoundaryIntertwiner[left, left];

solution["Dimension"]
solution["Basis"]
solution["KMatrix"]
```

## Closed-form catalogue

The general derivation machinery is distinct from the closed-form catalogue.
The main all-rank formula families have been extracted from qRE/qRE_II:

- untwisted A.1--A.4, B.1/B.2, C.1/C.2/C.4, and D.1/D.2/D.4;
- twisted B*.1/B*.2, tB*.1/tB*.2, C**.1/C**.2,
  tC**.1/tC**.2, and C*.1/C*.2/C*.4;
- generic non-quasistandard `r = l + 2` branches of untwisted B.1/C.1/D.1
  and twisted B*.1, tB*.1, C**.1, tC**.1, and C*.1. The untwisted
  BD.1 `(l,r)=(0,2)` two-parameter endpoint and the B.1 short-root endpoint
  `(l,r)=(n-1,n)` are also implemented.

For example:

```wl
d = <|
  "Rank" -> 3,
  "Family" -> "B*.1",
  "Parameters" -> <|
    "l" -> 0, "r" -> 2,
    "Lambda" -> lambda, "Mu" -> mu
  |>
|>;

result = KMatrix[d, u];
Normal[result["KMatrix"]] // MatrixForm
result["Provenance"]
```

For a non-quasistandard diagram, `Nu` is the additional deformation parameter:

```wl
d = CreateSatakeDiagram[
  "A2n-1(2)", 4, {4}, {1, 0, 2, 3, 4}];

result = KMatrix[d, u,
  "Parameters" -> <|"Nu" -> nu|>];
```

These generic formulas are not generalized cross matrices. At `Nu -> I` they
specialize exactly to the corresponding main-catalogue formulas. Canonical
coideal parameters can also be inferred for them with the same `"Parameters"`
option.

The manuscript-complete exceptional endpoints are also available. Supplying
`Nu` automatically selects the endpoint deformation for C**.1 at
`(l,r)=(n-1,n)` and for tC**.1 or C*.1 at `(l,r)=(0,1)`. The B*.1 endpoint
at `(l,r)=(0,2)` has two independent parameters:

```wl
KMatrix[
  <|"Rank" -> 3, "Family" -> "B*.1",
    "Parameters" -> <|"l" -> 0, "r" -> 2,
      "Nu0" -> nu0, "Nu1" -> nu1|>|>,
  u
]
```

They specialize to the main formulas at `Nu -> I`, or at
`Nu0 -> I, Nu1 -> I` for B*.1.

For B/C/D and twisted diagrams whose coideal regimes overlap, select the
family explicitly:

```wl
classification = ClassifySatakeDiagram[d];
classification["CandidateFamilies"]

result = KMatrix[
  <|"Rank" -> 4, "Family" -> "C.4",
    "Parameters" -> <|"l" -> 2, "Lambda" -> lambda|>|>,
  u,
  "QuantumParameter" -> q
];
```

This explicit choice is mathematically necessary in the reported overlapping
cases: `(X,tau)` alone does not determine which coideal-parameter regime is
intended.

`KMatrixCatalogue[]` reports which qRE and qRE_II formulas have been ported.
Entries marked `IntertwinerOnly` or `NoVectorKMatrix` are deliberately not
returned as closed formulas.

## Ambient R-matrices and reflection equations

The normalized trigonometric R-matrix is materialized directly as a sparse
matrix in the lexicographic tensor basis for every supported presentation:

```wl
r = AmbientRMatrix["A2n(2)T", 2, u, q];
Dimensions[r]
(* {25, 25} *)

AmbientRMatrixData["A2n(2)T", 2]["rMatrix", "matrix"]
```

The implementation covers the type-A, B/C/D, twisted-linear, and
twisted-quadratic formulas. `"CrossingParameterSquared"` can be supplied to
audit or compare a different source convention without choosing a branch for
the crossing parameter itself.

For a matrix-valued expression `k` in the symbol `u`, the exact tensor
residual and Boolean verifier are:

```wl
residual = ReflectionEquationResidual[k, diagram, {u, v}, q];
VerifyReflectionEquation[k, diagram, {u, v}, q]

certificate = ReflectionEquationCertificate[k, diagram, {u, v}, q];
certificate[[{"status", "level", "residualNonzeroCount"}]]
(* <|"status" -> "verified", "level" -> "exactSymbolic",
     "residualNonzeroCount" -> 0|> *)
```

The equation type is selected from the diagram and can be overridden with
`"Equation" -> "Standard"` or `"Transposed"`. The latter uses the qRE
convention with `R(1/(u v))` partially transposed in the first tensor factor.
`ReflectionEquationCertificate` records the equation and tensor conventions,
method, residual dimensions, assumptions, engine version, and provenance. A
zero symbolic residual is certified as an identity of rational functions for
generic parameters away from poles. The generated web catalogue attaches
exact certificates to all computable untwisted A/B/C/D solutions in the
exported ranks. Of 206 certified solutions, 205 verify. The remaining
low-rank D.2 candidate is retained as a failed audit record because its
structurally inferred parameters lie outside the source table's D.2
admissibility ranges; the same diagram's D.1 alternative verifies. Twisted
affine types remain explicitly `notComputed` until their conventions are
reconciled and tested.

## Tests

```bash
math -noprompt -run 'report=TestReport["Tests/QREKMatrices.wlt"]; Print[report]; Quit[]'
```

The suite covers Cartan symmetrization, generalized-Satake enumeration,
ordinary and dual vector representations for all nine presentations, standard
and antipode--transpose untwisted solves, a twisted-affine solve, and all main
catalogued families, including end-to-end verification using
source-assigned type-A and boundary-inferred coideal parameters. The latter
includes representatives of all eleven twisted catalogue families, transported
fork representatives, every generic non-quasistandard family, and all four
manuscript-complete exceptional endpoint formulas. It also checks sparse
R-matrix materialization and regularity in all nine series, plus exact rational
samples of unitarity and the Yang--Baxter equation and an exact reflection-
equation certificate. It also covers the arbitrary-rank diagram schematics:
registry coverage and layouts, the C.1 token stream and brace anchors, the
B.1a/B.1b fork representatives distinguished by their `tau` edge, and the
schematic carried by exported family records and by the manifest family
index.

## Web explorer

`apps/web` is a static-first **family atlas**. Its unit of navigation is the
K-matrix family, not the individual diagram: the 24 families across the nine
presentation blocks are the objects a reader looks up, while the 1,101
enumerated diagrams are examples of them.

```bash
math -script Scripts/ExportWebCatalogue.wls
cd apps/web
npm ci
npm run validate:data
npm run dev
```

A family page shows, in reading order, the arbitrary-rank generalized Satake
diagram, the restrictions that define the family, `K(u)` with its `k_i` and
`M_i` definitions, and the branch strata. The concrete-rank explorer and the
construction/verification record (QSP presentation, ambient R-matrix,
reflection-equation certificates, provenance) are retained behind disclosures
so the page reads as mathematics rather than as a dashboard.

### Arbitrary-rank diagram schematics

`KMatrixFamilySchematic[family]` gives the diagram of a family as it is drawn
in the source tables: black and white nodes, single and double bonds, forks,
`tau`-orbits, `p_i` braces, and dashed runs standing for blocks of arbitrary
admissible length. Twenty-three families carry one or more representative
variants; exceptional D.3 has none, because it has no nonzero vector
K-matrix.

```wl
schematic = KMatrixFamilySchematic["B.1"];
Lookup[schematic, "VariantID"]
(* {"B.1a", "B.1b"} *)
First[schematic]["CapLeft"]["Kind"]
(* "fork" *)
```

A schematic is a flat token stream of nodes and links carrying **no
geometry**; the renderer derives every coordinate. Three layouts are used:
`"linear"` for a chain optionally capped by forks, `"folded"` for a cycle
folded about the `tau`-axis and drawn as two rows joined by rungs, and
`"cycle"` for the closed type-A rings. The schematics are exported inside each
family record and, for the atlas index, once in `manifest.json`, so browsing
the whole atlas does not require loading per-rank catalogues.

The current generated release covers twisted and untwisted type/rank
catalogues, interactive diagram selection, classification and regime data,
sparse K-matrices where computed, explicit candidate-family selection,
self-hosted mathematical rendering, provenance, and JSON/LaTeX downloads. It
also exports instantiated QSP generator presentations, shared representation
records, sparse ambient R-matrices, and convention-bound reflection equations.
Family content is package-owned and exported as first-class records. Every
untwisted family A.1--A.4, B.1/B.2, C.1/C.2/C.4, and D.1--D.4, and every
twisted family B*.1/B*.2, tB*.1/tB*.2, C**.1/C**.2, tC**.1/tC**.2, and
C*.1/C*.2/C*.4 now has a structured theorem formula (or, for D.3, the
source-backed nonexistence statement), semantic expression tree, parameter
domain, branch constraints, and manuscript anchors. Computable solutions
export bare and canonical diagonally dressed matrices, spectra with multiplicities,
characteristic and minimal identities, determinant and rank loci,
factorisation, regularity, and boundary unitarity. The B.1/C.1/D.1
and twisted non-quasistandard branches retain their distinct formulas and
spectra. Each property carries assumptions, provenance, and its verification
method. C*.4 replaces the unfinished source eigendecomposition by an exact
block characteristic identity, including its quadratic `0,0'` factor,
determinant, regularity, and unitarity. The exporter is configured
through rank six for every supported presentation (A2n-1(2) and its transpose
start at rank three; D(1) starts at rank four), using lazy per-diagram detail
files. Exact expanded QSP relations, twisted reflection-equation convention
reconciliation, and interactive free-parameter substitution remain extension
boundaries. See `Documentation/PlatformArchitecture.md`,
`Documentation/PlatformRoadmap.md`, and `Documentation/PlatformDeployment.md`.

## Current research boundary

The package computes represented intertwiners for every enumerated generalized
Satake diagram in the supported classical affine types once compatible
parameters are supplied. It also exposes the main closed-form
catalogue and structurally classifies the B/C/D and twisted families. It does
not yet resolve genuinely overlapping regimes from coideal parameter data,
encode all canonical coideal assignments, handle representation-changing
exceptional automorphisms, or invent formulas for the 31 endpoint diagrams
whose source branches are absent or explicitly unfinished. Those are the next
extraction layers; see
`Documentation/ResearchNotes.md`.
