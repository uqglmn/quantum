# Research notes and implementation map

Updated 2026-08-17.

## Local source hierarchy

- `notes/working-version/qRE/` is the source tree for Regelskis--Vlaar,
  *Reflection matrices, coideal subalgebras and generalized Satake diagrams of
  affine type* (arXiv:1602.08471). Its stable inputs for this package are the
  definitions in `files/algebras.tex`, the vector representations in
  `files/natrep.tex`, the two boundary equations in `files/Kmatrices.tex`, the
  diagram classification in `files/classSatdiags.tex`, and the formulas in the
  `files/results*.tex` files.
- `notes/working-version/qRE_II/` extends those calculations to the twisted
  affine Cartan presentations. `rep_temp.tex`, `satake_temp.tex`,
  `plain_temp.tex`, `alt_temp.tex`, `par_temp.tex`, `nqs_temp.tex`, and
  `res_temp.tex` are the main readable sources. The Mathematica notebooks are
  useful computational evidence but contain unfinished and duplicated states.
- `refs/arXiv-1807.02388v4.tex` develops generalized-Satake coideals and
  universal K-matrices in finite type. `refs/arXiv-2108.00260v3/` contains the
  later classification and structure theory of pseudo-symmetric pairs.

## Mathematical pipeline used by the package

For a generalized Satake diagram `(X,tau)` with affine Cartan matrix `A`, the
package computes the finite parabolic longest element `w_X`, constructs the
vector evaluation representation, and represents

```text
theta_q = T_{w_X} tau omega_q,
B_i = F_i - c_i T_{w_X}(E_{tau(i)}) K_i^(-1) - s_i K_i^(-1).
```

It then solves one of the linear systems

```text
K(u) rho_{eta u}(b) = rho_{eta/u}(b) K(u),
K(u) rho_{eta u}(b) = rho^t_{eta/u}(S(b)) K(u).
```

The second system is not a different affine Cartan presentation: it is the
antipode--transpose boundary equation. This distinction matters particularly
in untwisted type A. For type A_n^(1), n>1, the qRE classification states that
the applicable equation depends on the diagram involution; for the other
classical untwisted types the ordinary and transposed forms are related by the
skew self-duality of the vector representation.

The represented braid operators are obtained by solving their conjugation
relations rather than hard-coding matrices. This makes the implementation
uniform across the nine current Cartan presentations and gives an independent
linear-algebra check of the Lusztig braid conventions.

## Literature map

The main relevant primary sources are:

1. Regelskis--Vlaar, [Reflection matrices, coideal subalgebras and generalized
   Satake diagrams of affine type](https://arxiv.org/abs/1602.08471). This is the
   direct basis for the untwisted vector-representation classification and the
   local qRE source tree.
2. Regelskis--Vlaar, [Quasitriangular coideal subalgebras of Uq(g) in terms of
   generalized Satake diagrams](https://arxiv.org/abs/1807.02388). This extends
   the coideal/universal-K construction from Satake to generalized Satake
   diagrams in finite type.
3. Balagovic--Kolb, [Universal K-matrix for quantum symmetric
   pairs](https://arxiv.org/abs/1507.06276). This supplies the finite-type
   universal-K framework behind the later constructions.
4. Appel--Vlaar, [Universal K-matrices for quantum Kac--Moody
   algebras](https://arxiv.org/abs/2007.09218). This gives a Kac--Moody-level
   cylindrical-bialgebra construction and clarifies generalized reflection
   equations beyond a single vector representation.
5. Appel--Vlaar, [Trigonometric K-matrices for finite-dimensional
   representations of quantum affine algebras](https://arxiv.org/abs/2203.16503).
   This proves existence and rationality for arbitrary finite-dimensional
   modules of quantum affine symmetric pairs and covers standard and transposed
   reflection equations for important module classes.
6. Kusano--Okado--Watanabe, [Kirillov--Reshetikhin modules and quantum
   K-matrices](https://arxiv.org/abs/2209.10325). This is relevant to extending
   the package from vector representations to fused/KR modules, especially in
   quasi-split affine type A.
7. Appel--Vlaar, [Boundary transfer matrices arising from quantum symmetric
   pairs](https://arxiv.org/abs/2410.21654). This places K-matrices in a current
   universal framework for boundary transfer matrices and records open
   problems relevant to future package scope.

Together these sources suggest two complementary package layers: explicit
low-dimensional intertwiners, where qRE/qRE_II provide formulas and
classifications, and a representation-independent universal layer suitable for
future evaluation in other finite-dimensional modules.

## Verified implementation scope

- Untwisted: `A(1)`, `B(1)`, `C(1)`, `D(1)`.
- Twisted/reversed presentations: `A2n-1(2)`, `A2n-1(2)T`, `A2n(2)`,
  `A2n(2)T`, `Dn+1(2)`.
- Enumeration and validation of generalized Satake diagrams at a fixed rank.
- Batch `KMatrixTable` output for every enumerated diagram, retaining
  structured failure/status records for partially available candidates,
  non-quasistandard cases, and parameter-extraction failures.
- Non-choosing `KMatrixCandidates` output for overlapping plain/alternating
  coideal regimes. Each alternative is returned with its family and full
  formula result; representative alternatives pass boundary inference.
- Vector evaluation and antipode--transpose dual representations.
- Chevalley, Cartan, commutator, and quantum Serre verification.
- Lusztig braid action, represented QP generators, and linear K-matrix solve.
- Automatic choice between ordinary and antipode--transpose equations.
- Extracted main closed-form families with provenance metadata:
  untwisted A.1--A.4, B.1/B.2, C.1/C.2/C.4, D.1/D.2/D.4; twisted
  B*.1/B*.2, tB*.1/tB*.2, C**.1/C**.2, tC**.1/tC**.2, and
  C*.1/C*.2/C*.4. The D.4 special two-parameter branch is included.
- Unique type-A family classification and A.3 parameter extraction; structural
  plain/alternating/parallel classification for B/C/D and twisted regimes using
  white-node orbit representatives, with explicit reporting of genuine
  one-orbit overlaps, non-quasistandard regimes, and exceptional D.3.
- Canonical bare coideal assignments for A.1, A.2, and A.4, with end-to-end
  verification against their catalogued K-matrices.
- Boundary-equation inference of `c_i,s_i` from a K-matrix, with rejection of
  spectral-dependent spurious solutions. This gives independently verified
  canonical data for representative cases of every main untwisted family
  B.1/B.2, C.1/C.2/C.4, and D.1/D.2/D.4, as well as every main twisted family
  B*.1/B*.2, tB*.1/tB*.2, C**.1/C**.2, tC**.1/tC**.2, and C*.1/C*.2/C*.4.
- Reconciliation of the plain twisted notebook conventions. Executable
  notebook definitions take precedence over contradictory draft prose:
  `KDC1` uses `lambda = I q^(n-r+1)`; `KCD1` uses
  `lambda = I q^(n-r)` and its minus-sign `k2`; and `KCB1` evaluates its
  plus-sign auxiliary function at `-u`, producing the same effective minus
  sign. These choices pass the represented boundary equations.
- Generic non-quasistandard `r=l+2` closed formulas for B*.1, tB*.1,
  C**.1, tC**.1, and C*.1, including the additional `Nu` parameter. They pass
  canonical boundary inference, and their `Nu^2=-1` specialization agrees
  exactly with the corresponding main formula.
- The manuscript-complete exceptional endpoint blocks B*.1 `(0,2)`, C**.1
  `(n-1,n)`, tC**.1 `(0,1)`, and C*.1 `(0,1)`. Each passes the represented
  boundary equation and specializes exactly to the main formula. The executable
  notebook resolves three draft discrepancies: KCB1xx uses the plus auxiliary
  `k2` convention and `nu+nu^-1` in its special diagonal term; KBC1xx has an
  extra spectral factor in its special diagonal term; and KBB1xx keeps that
  diagonal term outside M3. The tB*.1 `(n-2,n)` block remains disabled because
  the draft explicitly labels it unfinished and comments out its provisional
  formula.
- Source-table fork parity is enforced for B*/tB* plain diagrams. Closed
  formulas are transported across left/right fork exchanges and other
  compatible diagram automorphisms by a spectral representation intertwiner
  derived from the Chevalley generators. The transported formula
  `G(eta/u)^(-1) K(u) G(eta u)` is independently checked by boundary inference.
- The ambient R-matrix and reflection-equation layer gives exact symbolic
  tensor certificates for untwisted A/B/C/D K-matrices within the configured
  bulk certification threshold (currently rank three), and source-identity
  evidence above it. The independent rank-four audit found one exception: the
  low-rank D.2 proposal
  on `X={0,1}`, `tau=(3 4)` in D4(1): its `(l,r)=(2,3)` lies outside the
  source table's D.2 admissibility ranges and has a nonzero exact residual,
  while the diagram's D.1 alternative verifies. The platform preserves this
  as a conditional mixed-candidate audit result. Twisted reflection equations
  remain source-backed until their R/K normalization and crossing conventions
  are reconciled.

## Next extraction stages

The rank-six catalogue leaves 31 diagrams at
`NonQuasistandardFormulaRequired`. This is a source boundary, not a classifier
failure: nine are the two C.1 end loci `(0,2)` and `(n-2,n)` where present; four
are the B*.1 right endpoints `(n-2,n)`; eight are the two tB*.1 endpoints
`(0,2)` and `(n-2,n)`; five are the C**.1 left endpoints `(0,2)`; and five are
the tC**.1 left endpoints `(0,2)`. The implemented generic ranges and the
manuscript-complete exceptional endpoints remain computed. Any future formula
for these 31 records must be labelled conjectural unless it is recovered from
additional source calculations and independently passes the represented
boundary equation.

1. Use explicit coideal data to select among the alternatives already exposed
   for genuinely overlapping regimes, and encode the remaining low-rank
   coincidences and representation-changing exceptional automorphisms.
2. Transcribe the admissible `c`, `s`, dressing, and scaling assignments family
   by family, using boundary inference as an independent check, including the
   special parameter branches not represented by the current canonical
   witnesses.
3. Reconstruct and test the unfinished tB*.1 special endpoint and remaining
   low-rank exceptional formulas, retaining explicit provenance and
   `conjectural for general rank` metadata where the manuscripts only establish
   low-rank computational evidence.
4. Reconcile the twisted R/K normalization and crossing conventions family by
   family, then extend exact reflection certificates to the twisted catalogue.
5. Extend beyond the current classical vector representations: exceptional
   affine cases, Kirillov--Reshetikhin modules, fusion, and eventually an
   interface to universal K-matrices.
