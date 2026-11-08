# Quick start

## Prepare the repository

Use the Node version in `.nvmrc`, clone the repository, and install its workspaces:

```sh
git clone https://github.com/SimonSiefke/vscode-memory-leak-finder.git
cd vscode-memory-leak-finder
npm run install:ci
```

The command installs and links package dependencies. Many end-to-end runs download a VS Code build on first use and need a desktop display; on Linux, CI uses Xvfb for headless sessions.

## Run a focused scenario

A typical command selects a scenario, measure, and number of cycles:

```sh
node packages/cli/bin/test.js --cwd packages/e2e --only <scenario> --measure <measure-id> --runs 5
```

Use `--help` for current CLI options and available scenario names. A measure can change collection behavior and runtime substantially; begin with a small run count while checking the output. Add `--check-leaks` only for measures that implement a leak assertion. The command writes result JSON beneath `.vscode-memory-leak-finder-results`.

## Generate charts

```sh
npm run build-charts
```

Charts are written to `.vscode-charts`. Open the relevant report's `index.html`; some reports are self-contained and can be inspected locally. For a trend across revisions, see the [large benchmark guide](https://github.com/SimonSiefke/vscode-memory-leak-finder/blob/main/packages/large-benchmark/README.md).

> Exact flags, scenario names, required platform tools, and measure options evolve with the code. Check the CLI help and the detailed guide linked from the [measure catalog](/measures/) before launching a long run.
