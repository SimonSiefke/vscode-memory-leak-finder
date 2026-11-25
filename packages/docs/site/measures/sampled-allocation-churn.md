# Sampled allocation churn

`sampled-allocation-churn` (id `sampledAllocationChurn`) reports which JavaScript functions allocated V8 heap memory during the measured window, **including objects that were already garbage collected**. It uses the V8 sampling heap profiler (`HeapProfiler.startSampling` with `includeObjectsCollectedByMajorGC` and `includeObjectsCollectedByMinorGC`), so it works on an unmodified VS Code build without an instrumented workbench:

```sh
node packages/cli/bin/test.js --cwd packages/e2e --only '^editor-type-many-characters.ts' --run-skipped-tests-anyway --measure-after --runs 2 --measure sampled-allocation-churn
```

The renderer is measured by default. Combine it with `--measure-node`, `--inspect-extensions`, `--inspect-shared-process`, `--inspect-ptyhost` or `--inspect-process <name>` to measure that isolate instead, for example a language server. Renderer web workers are separate isolates and are not covered. The result is informational: `isLeak` is always `false`, because allocating short-lived memory is not a leak.

## Result

- `supported` / `unsupportedReason`: whether the target retained samples for collected objects.
- `samplingIntervalBytes`: the mean sampling interval, 32768 bytes.
- `metrics.sampledAllocatedBytes`: the estimated bytes allocated in the window; `metrics.sampleCount`: the number of raw samples; `metrics.callFrameCount`: distinct call frames that allocated.
- `topSelfBytes`: up to 50 call frames (`functionName`, `url`, `scriptId`, zero-based CDP `lineNumber`/`columnNumber`, `selfBytes`), merged across all callers and sorted by `selfBytes`.
- `topStacks`: up to 20 allocation stacks, leaf first, at most 16 frames deep. Stack strings use one-based `line:column` like JavaScript stack traces.

Frames without a `url` are V8 builtins or internal allocations such as `substring`, `push` or `(V8 API)`; look at `topStacks` for the JavaScript caller. Rows carry generated `url`/`line`/`column` positions; source maps are not applied. No raw profile is stored.

## Interpreting the values

The byte values are Poisson-scaled estimates from V8's sampling profiler. They are not exact, they are not retained size, and they are not comparable byte-for-byte with heap snapshots, `gc-statistics` `garbageMB` or `/proc` memory numbers. Expect the same order of magnitude as `garbageMB`, not an equal value. Small values from a few samples are noisy; compare repeated runs and use a control scenario such as `base`.

## Self-check and limitations

V8 accepts unknown `startSampling` parameters silently, so an older runtime could return live-only data. Before the measured window the collector samples about 4 MiB of short-lived objects, forces a garbage collection and reads the profile. If less than 1 MiB was retained, the result is `supported: false` with a reason and empty rows. A target without `HeapProfiler` sampling, or a sampler stopped by another client during the window, is also reported as unavailable instead of failing the run.

Each isolate has one sampling heap profiler. Do not combine this measure with DevTools "Allocation sampling" or `--open-devtools`. Keeping samples of collected objects makes the profiler's own memory grow with the allocation volume, so keep `--runs` small. Sampling is stopped and `HeapProfiler` is disabled when the measure is released.
