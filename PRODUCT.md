# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Repository documentation suggests the primary users are developers investigating VS Code memory behavior through generated browser reports. This audience and its viewing context have not been confirmed directly.

## Product Purpose

The repository describes its purpose as finding memory leaks in VS Code to improve robustness and performance. Its charts package generates browser reports from collected measurements and evidence.

## Positioning

Open: repository documentation establishes the product goal but does not define a distinctive mechanism or a claim unique to this tool. Do not make comparative claims.

## Operating Context

Reports are generated from automated VS Code scenarios and measurements, then viewed as static web pages, including GitHub Pages deployments. A report contains charts and supporting evidence across multiple process and memory measures.

## Capabilities and Constraints

The chart package generates root and nested report pages. A shared layout copies one SVG favicon into the generated site and inserts relative links so it resolves from root and nested pages. The icon must remain legible at browser-tab sizes and work on light and dark browser surfaces.

## Brand Commitments

The card owner rejected prior blue-tile and coral-droplet favicon designs; a prior comment also said an older design looked too similar to Trello. Avoid repeating those visual concepts or Trello's recognizable blue tile.

## Evidence on Hand

- Repository overview: `README.md`.
- Existing report layout and icon integration: `packages/charts/src/parts/ApplySiteLayout/ApplySiteLayout.ts`.
- Root and nested favicon-link coverage: `packages/charts/test/SiteLayout.test.ts`.
- Current user-provided reference screenshot: the card attachment in the attempt snapshot; it shows the report in a browser tab.

## Product Principles

- Findings should help developers improve VS Code robustness and performance.
- Reports should expose measured evidence without implying that a measurement alone proves a leak.
- Generated reports should remain usable as static web pages at root and nested paths.
