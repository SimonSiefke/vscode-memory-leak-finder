# Large Benchmark

Compare two minified Linux x64 VS Code builds with paired startup, interaction,
resource, trace, profiling, memory, and bundle-size measurements. The package owns
the benchmark manifest, deterministic fixtures, collectors, result format, and
offline comparison report.

The manual [Large Performance Measure workflow](../../.github/workflows/large-performance.yml)
uses this package. See the [repository guide](../../README.md#large-performance-measure)
for the complete suite, requirements, report statistics, and local examples.

Run commands from the package directory using Node from the repository's `.nvmrc`:

```sh
cd packages/large-benchmark
npm run matrix -- --before-commit BEFORE_SHA \
  --after-commit AFTER_SHA --output-dir .tmp/large-manifest
npm run prepare-build -- --commit BEFORE_SHA \
  --output-dir .tmp/large-before
npm run benchmark -- extract --commit BEFORE_SHA \
  --input-dir .tmp/large-before
npm run measure -- --benchmark-id open-small-timing \
  --samples 5 --before-commit BEFORE_SHA --after-commit AFTER_SHA \
  --before-path BEFORE_EXECUTABLE --after-path AFTER_EXECUTABLE \
  --output-dir .tmp/large-results/open-small-timing
npm run report -- --manifest .tmp/large-manifest/manifest.json \
  --input-dir .tmp/large-results --output-dir .tmp/large-report
```

Use full 40-character hashes for `BEFORE_SHA` and `AFTER_SHA`. Building commits
uses the repository's existing CLI build pipeline. Measuring prebuilt executables
and generating reports run directly from this package. The root
`large-performance`, `large-performance:prepare`, `large-performance:measure`,
and `large-performance:report` commands remain available as shortcuts. Relative
paths resolve from the command's working directory; `npm --prefix` runs scripts
inside the package, so use absolute paths when referencing files elsewhere.

`prepare-build` is an explicit build command; installing the package does not
build VS Code. Tests run with `npm --prefix packages/large-benchmark test` and
type checks with `npm --prefix packages/large-benchmark run type-check`.
