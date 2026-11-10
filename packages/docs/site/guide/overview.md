# Project overview

VS Code Memory Leak Finder is a collection of tools for exercising VS Code and inspecting retained state, resource counts, runtime behavior, and performance. It helps turn a suspected leak into repeatable evidence. A rising count is a signal to investigate; it is not by itself proof of a leak.

## The basic model

A useful investigation has four parts: a known application build, a repeatable scenario, a measurement chosen for the resource in question, and an artifact that preserves enough context to compare results. The repository provides scenario runners, DevTools based collectors, process-level measurements, chart generation, and reports.

Measurements have different scopes. Some inspect a renderer or extension host through the Chrome DevTools Protocol; others observe operating-system process resources, native allocators, or runtime timing. Read the measure's limitations before interpreting a result. Platform support and data quality vary by collector.

## Repository map

- `packages/cli` parses options and orchestrates VS Code test runs.
- `packages/e2e` contains browser and editor workflows and their page objects.
- `packages/memory-leak-finder` implements DevTools collectors and comparisons.
- `packages/charts` turns result files into browsable reports.
- `packages/electron-e2e` measures standalone Electron lifecycle scenarios.
- `packages/large-benchmark` runs paired, version-to-version performance investigations.
- The [measure catalog](/measures/) and [scenario guides](/guide/scenarios) contain detailed measurement and workflow notes.

[Read the execution flow](/guide/execution-flow) or [start a local run](/guide/quick-start).
