# Scenarios

Scenarios are repeatable user or API lifecycles. Choose one that creates and then disposes the resource you suspect, and keep its inputs stable across comparison runs. Repository scenarios cover editing, window and editor lifecycles, extensions, webviews, and targeted resource behaviors.

The `--only` option selects a named scenario. `--runs` controls repetitions; some investigations use warmups, restart between runs, or intentionally include skipped scenarios. These options change both evidence and cost. Consult the [CLI help](https://github.com/SimonSiefke/vscode-memory-leak-finder/tree/main/packages/cli) and scenario documentation before using advanced combinations.

Explore [Markdown editing](../scenarios/markdown-editing), [Python development](../scenarios/python-development), [accessibility marker signals](../scenarios/accessibility-marker-signals), and [edit telemetry document snapshots](../scenarios/edit-telemetry-document-snapshots). Each guide is indexed by the site's local search.
