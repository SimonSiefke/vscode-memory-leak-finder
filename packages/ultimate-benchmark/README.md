# Ultimate Benchmark

Compare two minified Linux x64 VS Code builds with paired startup, interaction,
resource, trace, profiling, memory, and bundle-size measurements. The package owns
the benchmark manifest, deterministic fixtures, collectors, result format, and
offline comparison report.

The manual [Ultimate Performance Measure workflow](../../.github/workflows/ultimate-performance.yml)
uses this package. See the [repository guide](../../README.md#ultimate-performance-measure)
for the complete suite, requirements, report statistics, and local examples.

Run commands from the package directory using Node from the repository's `.nvmrc`:

```sh
cd packages/ultimate-benchmark
npm run matrix -- --before-commit BEFORE_SHA \
  --after-commit AFTER_SHA --output-dir .tmp/ultimate-manifest
npm run prepare-build -- --commit BEFORE_SHA \
  --output-dir .tmp/ultimate-before
npm run benchmark -- extract --commit BEFORE_SHA \
  --input-dir .tmp/ultimate-before
npm run measure -- --benchmark-id open-small-timing \
  --samples 5 --before-commit BEFORE_SHA --after-commit AFTER_SHA \
  --before-path BEFORE_EXECUTABLE --after-path AFTER_EXECUTABLE \
  --output-dir .tmp/ultimate-results/open-small-timing
npm run report -- --manifest .tmp/ultimate-manifest/manifest.json \
  --input-dir .tmp/ultimate-results --output-dir .tmp/ultimate-report
```

Use full 40-character hashes for `BEFORE_SHA` and `AFTER_SHA`. Building commits
uses the repository's existing CLI build pipeline. Measuring prebuilt executables
and generating reports run directly from this package. The root
`ultimate-performance`, `ultimate-performance:prepare`, `ultimate-performance:measure`,
and `ultimate-performance:report` commands remain available as shortcuts. Relative
paths resolve from the command's working directory; `npm --prefix` runs scripts
inside the package, so use absolute paths when referencing files elsewhere.

`prepare-build` is an explicit build command; installing the package does not
build VS Code. Tests run with `npm --prefix packages/ultimate-benchmark test` and
type checks with `npm --prefix packages/ultimate-benchmark run type-check`.
