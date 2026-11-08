# Reports

Charts are generated from local or CI result artifacts. The published site can expose the report set produced by the latest Pages workflow; the exact reports depend on which measurements ran successfully. A report missing from a run is not evidence of a zero count.

For local results, run `npm run build-charts` after collecting measurements, then open the HTML under `.vscode-charts`. Large paired comparisons have their own [offline report format and interpretation notes](https://github.com/SimonSiefke/vscode-memory-leak-finder/blob/main/packages/large-benchmark/README.md).

Keep the run metadata with the report. Check commit, VS Code version, platform, scenario, measure, repetitions, and warmup/restart options before comparing values. Return to the [measure catalog](/measures/) for collector scope and caveats.
