# ADR 0001: Static-first, provider-based platform

Status: Accepted for the first platform slice.

## Context

The platform must browse generalized Satake diagrams and their QSP, K-matrix,
R-matrix, reflection-equation, transformation, property, and verification data.
Some objects are stable catalogue data, while derivation and full verification
can require a live symbolic kernel. The public interface must remain useful
when no computation service is available.

## Decision

1. `QREKMatrices` is the authoritative mathematical engine.
2. A deterministic build exports a versioned, safe expression tree and
   catalogue JSON. Raw Wolfram Language source is never evaluated by the
   browser.
3. The frontend depends on a `CatalogueProvider` contract. Its first provider
   reads static files; later providers may call Wolfram Cloud or another
   backend.
4. Mathematical regime and realization are independent. In particular,
   main/non-quasistandard selects a solution, while bare/dressed/transported
   selects a transformation chain applied to it.
5. Unsupported and ambiguous diagrams are typed domain results, not discarded
   rows or generic errors.
6. Every artifact carries schema, engine, provenance, and verification version
   metadata.

## Consequences

- Browsing is fast, cacheable, reproducible, and independent of cloud credits.
- New types, representations, property kinds, and compute providers can be
  registered without changing the overall page structure.
- Catalogue schemas require explicit versioning and compatibility tests.
- Large or custom computations need a separate synchronous/asynchronous API.
- Generated data must never be edited by hand.
