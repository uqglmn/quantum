# Platform deployment and operations

## Recommendation

Use GitHub as the source and review system. Deploy the static explorer either
to GitHub Pages for the smallest operational footprint or to Cloudflare Pages
when pull-request preview URLs, edge headers, and a future Worker gateway are
worth the extra account. Keep Wolfram Cloud behind a provider-neutral gateway;
do not make the browser or stored project data depend on Wolfram URLs.

The checked-in GitHub Pages workflow validates all committed mathematical JSON
against its schema and builds the site before publishing. GitHub's documented
custom Pages flow uses `configure-pages`, `upload-pages-artifact`, and
`deploy-pages`; this project needs only the latter two because Vite uses
relative asset URLs. See:

- <https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages>
- <https://developers.cloudflare.com/pages/framework-guides/deploy-a-vite3-project/>

## Reproducible release

From the project root, with a licensed Wolfram kernel available:

```bash
math -script Scripts/ExportWebCatalogue.wls
cd apps/web
npm ci
npm run validate:data
npm run build
```

The Wolfram step is intentionally not run on a generic GitHub-hosted runner.
Generated artifacts are reviewed and committed, while an authorized local or
self-hosted release runner regenerates them. CI then checks their structure,
counts, unique identifiers, and frontend compatibility.

## GitHub Pages

1. Push the repository to GitHub.
2. In Settings → Pages, select GitHub Actions as the publishing source.
3. Run `Validate and deploy Satake explorer`, or push to `main`.
4. Add a custom domain in repository settings if desired.

This is the recommended MVP: no runtime server, no credentials in the browser,
and no Wolfram credit usage for catalogue browsing.

## Cloudflare Pages

Import the same GitHub repository and configure:

- root directory: `apps/web`;
- build command: `npm run validate:data && npm run build`;
- output directory: `dist`;
- Node version: 24.

Cloudflare Pages automatically creates branch/PR preview deployments. Add a
Worker only when live computations exist; static requests should continue to
go directly to immutable catalogue assets.

## Live symbolic compute

Wolfram `CloudDeploy[APIFunction[…], Permissions -> "Public"]` can expose a
prototype HTTP API. Wolfram documents APIFunction access from ordinary HTTP
clients and public CloudObject permissions:

- <https://reference.wolfram.com/language/ref/APIFunction.html>
- <https://reference.wolfram.com/language/ref/CloudDeploy.html>

It is suitable for low-volume beta computation, not as the architectural
centre. Instant API calls currently consume one cloud credit per 100 ms of
computation, so every operation needs caching, rank/time limits, and usage
telemetry: <https://www.wolfram.com/cloud-credits/index.php.en>.

The gateway should expose these bounded jobs:

- dress/transport/normalise an existing immutable solution;
- compute a K- or R-matrix for a registered type and representation;
- verify an intertwiner or reflection equation;
- compute eigenvalues, characteristic/minimal identities, factorisations,
  regularity, and unitarity;
- poll a long-running job by ID.

Never accept raw Wolfram Language. Accept schema-versioned diagram IDs,
registered operation enums, bounded ranks, and the restricted expression tree.
Cache by the canonical hash of engine version, operation, diagram, parameters,
and transformation chain.

## Environments and promotion

```text
pull request → schema/build checks → preview
             → mathematical review of regenerated artifacts
main         → immutable production build
             → smoke test manifest and one record per affine type
             → promote compute endpoint version independently
```

Retain the previous catalogue major version and compute deployment during a
rollback window. A frontend release may consume the same schema across engine
versions; a schema major change gets a new URL namespace.
