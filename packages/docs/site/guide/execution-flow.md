# Execution flow

A run starts in the CLI. It resolves a VS Code version and test directory, chooses scenarios, starts the editor with the requested instrumentation, and coordinates collection around each scenario's lifecycle. Scenario setup prepares state; repeated actions create comparable cycles; teardown releases test-owned resources even when a cycle fails.

Collectors attach to the relevant process or DevTools target and write structured result files. Depending on the measure, collection may take before/after heap snapshots, sample a counter, capture stack traces, or profile a timed interval. Some collectors require explicit process selection or operating-system tooling.

The chart package reads result artifacts and emits HTML reports. Preserve the raw JSON and run metadata when comparing revisions. Compare like with like: same scenario, build, platform, flags, cycle counts, and warmup policy. A count difference can reflect workload, timing, runtime noise, or a real retention issue; repeat and inspect source-level evidence before drawing a conclusion.

## Where to inspect

- Scenario lifecycle and browser automation: [`packages/e2e`](https://github.com/SimonSiefke/vscode-memory-leak-finder/tree/main/packages/e2e)
- Collector implementations: [`packages/memory-leak-finder`](https://github.com/SimonSiefke/vscode-memory-leak-finder/tree/main/packages/memory-leak-finder)
- Result visualization: [`packages/charts`](https://github.com/SimonSiefke/vscode-memory-leak-finder/tree/main/packages/charts)
- Build-to-build comparisons: [large benchmark package](https://github.com/SimonSiefke/vscode-memory-leak-finder/tree/main/packages/large-benchmark)
