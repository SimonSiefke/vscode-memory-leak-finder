# Scenarios

Scenarios are repeatable user or API lifecycles. Choose one that creates and then disposes the resource you suspect, and keep its inputs stable across comparison runs. Repository scenarios cover editing, window and editor lifecycles, extensions, webviews, and targeted resource behaviors.

The `--only` option selects a named scenario. `--runs` controls repetitions; some investigations use warmups, restart between runs, or intentionally include skipped scenarios. These options change both evidence and cost. Consult the [CLI help](https://github.com/SimonSiefke/vscode-memory-leak-finder/tree/main/packages/cli) and scenario documentation before using advanced combinations.

Existing examples include [Markdown editing](https://github.com/SimonSiefke/vscode-memory-leak-finder/blob/main/docs/scenarios/markdown-editing.md), [Python development](https://github.com/SimonSiefke/vscode-memory-leak-finder/blob/main/docs/scenarios/python-development.md), and [accessibility marker signals](https://github.com/SimonSiefke/vscode-memory-leak-finder/blob/main/docs/scenarios/accessibility-marker-signals.md). Additional scenario notes live in [`docs/scenarios`](https://github.com/SimonSiefke/vscode-memory-leak-finder/tree/main/docs/scenarios).
