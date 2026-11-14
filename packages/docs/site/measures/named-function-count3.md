# named-function-count3

Run one end-to-end scenario from the repository root:

```sh
node packages/cli/bin/test.js --cwd packages/e2e --only notebook-diff-editor-open.ts --runs 1 --check-leaks --measure-after --measure named-function-count3
```

Use the Node version in `.nvmrc` and run `npm run install:ci` first. The first run downloads VS Code and may need a desktop display. `notebook-diff-editor-open.ts` selects one scenario. The collector reports named JavaScript functions that remain after the measured run; a positive delta is a suspected leak signal, not proof that a function is permanently retained.

## Example chart

![Named function counts from the notebook-diff-editor-open scenario: black is the initial count and firebrick red is the increase measured after the scenario.](/charts/named-function-count3-notebook-diff-editor-open.svg)

Black shows the initial count (`count - delta`). Firebrick red shows the measured increase (`delta`). The bars are one historical GitHub Actions result for `notebook-diff-editor-open`, collected by commit [`a8eac6e`](https://github.com/SimonSiefke/vscode-memory-leak-finder/commit/a8eac6e8cf2d48b85f62719311c704e932cfb41e) in run [43116144343](https://github.com/SimonSiefke/vscode-memory-leak-finder/actions/runs/43116144343); they are an example, not a measurement of your current checkout. Open the [full named-function-count-3 report](https://simonsiefke.github.io/vscode-memory-leak-finder/named-function-count-3/) to inspect other scenarios.

Run `npm run build-charts` after collecting results to generate charts under `.vscode-charts`. Check the scenario, VS Code version, platform, warmup, and run settings before comparing counts across runs.
