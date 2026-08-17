# Quantum

Public software and computational resources for quantum algebra and integrable
systems.

## Projects

- [K-matrices](./kmatrices/) — generalized Satake diagrams, quantum symmetric
  pairs, and reflection K-matrices for twisted and untwisted affine types.

The repository is organized as a monorepo: each project owns its source,
tests, and documentation in a top-level directory. The central Pages workflow
assembles their static applications under matching URL paths.

`infrastructure/pages-workflow.yml` is the validated GitHub Actions workflow
template. It can be installed as `.github/workflows/pages.yml` when the
repository token has workflow-management scope. The initial release is
published from the `gh-pages` branch.
