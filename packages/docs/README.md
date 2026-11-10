# Documentation

The project documentation site lives in [`site`](./site). It uses VitePress to publish a searchable field guide alongside the existing generated measurement reports on GitHub Pages.

## Build and preview

Install repository dependencies from the root and run:

```sh
npm run docs:build --workspace packages/docs
npm run docs:preview --workspace packages/docs
```

The static site is written to `.vscode-charts/docs`, leaving chart and report paths at the artifact root unchanged. The published site uses `/vscode-memory-leak-finder/docs/` as its base path.

## Documentation source

The overview, quick start, execution flow, scenario guide, and report guide are maintained in `site`. The measure catalog is generated from the public collector registry in `packages/memory-leak-finder/src/parts/Measures/Measures.ts`. Detailed measure and scenario guides also live in `site`, where VitePress includes them in local search. CI audit records are kept in `ci-audits` and are not published as user guides.

## Existing project guides

- [Large performance benchmarks](../large-benchmark/README.md)
- [Electron end-to-end tests](../electron-e2e/README.md)
- [Scenario guides](./site/scenarios)
- [Measure guides](./site/measures)
- [CI audit records](./ci-audits)
