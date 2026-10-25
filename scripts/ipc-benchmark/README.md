# Focused IPC measurements

These tools load explicit compiled VS Code implementations. They communicate over real Node worker-thread MessagePorts or Electron renderer/utility-process MessagePorts. Run one experiment at a time on an otherwise idle machine. Keep the selected source, compiler options, compiled files and all failed attempts with the results.

## Hardware instructions: primary CPU-work metric

Linux `perf stat` counts retired user and kernel instructions separately in the target application and its inherited workers/processes. Counting starts after warmup and full GC in both peers and stops before final validation. Xvfb is outside the counted process tree. Instructions measure CPU work, not elapsed speed or whole-product startup. Node and Electron are different topologies and must be reported separately.

Requirements: Python 3, Node matching the product, Linux perf with permitted hardware counters, and Xvfb plus a matching Electron binary for renderer runs. The collector rejects unavailable counters and counter running percentages below 99%. It records raw counter rows, runtime versions, compiled protocol/port hashes, options, elapsed time, returned-value validation and exact executed request counts. A timeout cleans up the measurement's own process group. Use a new output directory for each campaign; failures remain on disk and are not silently replaced.

Supply a runtime map, using separate frozen compiled output trees with the same dependencies and compiler options:

```json
{
  "control": { "root": "/absolute/before", "module": "vs/workbench/services/extensions/common/rpcProtocol.js" },
  "candidate": { "root": "/absolute/after", "module": "vs/workbench/services/extensions/common/rpcProtocol.js" }
}
```

Each tree needs its compiled imports under `out`, a `package.json` declaring `"type": "module"`, and, for Electron, `.build/electron/code-oss`. Never share mutable output files between variants. A copied runtime must preserve each module's canonical import paths so private symbol identities match. Do not share or symlink `node_modules` between worktrees.

```sh
python3 scripts/ipc-benchmark/perf-pairs.py \
  --root /absolute/before --runtime-map /absolute/runtimes.json \
  --output /absolute/results/node-sync-50 --variants control,candidate \
  --fixtures primitive,small-object,settings-100 \
  --replicates 50 --iterations 32768 --warmup 16384 --concurrency 32
```

Use `perf-electron-pairs.py` with the same arguments for a Node-disabled renderer and a utility process. The Electron measurement owns its application processes and does not interact with a user's desktop application. The Linux product's 8 KiB Buffer pool is applied explicitly in Node peers; renderer `Buffer` must be absent.

`--handler sync` returns the value immediately, `--handler resolved` returns a resolved native promise, and `--handler deferred` resolves on the next `setImmediate` task. Measure these separately to expose acknowledgement and promise-path tradeoffs. Test sequential calls with `--concurrency 1` as well as concurrent traffic. Available payloads also include `text-4KiB`, `text-64KiB` and `text-escaped`. No fixture results should be pooled across topologies, handler modes or host environments.

Before selecting a small improvement, run an identical-code A/A comparison: map both labels to the exact same frozen tree/module and check that hashes match and the interval includes zero. Two-variant campaigns alternate AB/BA order; campaigns with more variants use cyclic orders and reversals. Use a replicate count divisible by twice the number of variants for complete position balance. Fixture order is randomized with a recorded fixed seed. The summary uses the median paired log-ratio across independent processes and an exploratory 95% bootstrap interval with 10,000 resamples. There is no multiple-comparison correction: exploratory candidates require a separate confirmation campaign.

`instruction-coverage.mjs` and `instruction-process-coverage.mjs` are counter-coverage probes: fixed arithmetic runs only in a worker thread or a child process, respectively. Increasing that work should proportionally increase inherited gated counters. They use the same `PERF_CONTROL`/`PERF_ACK` FIFO handshake as the measurements. Retain these probes and A/A controls alongside comparisons.

## Allocation diagnostics

`allocations.mjs` runs fixed-work RPC calls with V8 allocation sampling, including objects collected by minor and major GC. Sampling estimates allocated bytes; it does not measure retained heap or wall-clock speed. The disposable tracker separately counts exact disposable constructions. Both peers run in one process so the profile covers sender and receiver. This is a diagnostic topology; hardware/timing comparisons use separate workers/processes.

Set `IPC_OPT_BENCH_OPTIONS` to JSON containing `root`, compiled `module`, `fixture` (`primitive`, `small-object`, `text-64KiB` or `text-escaped`) and `iterations`, and set `OUTPUT` to a fresh result file. Launch:

```sh
node --import ./scripts/ipc-benchmark/product-pool.mjs ./scripts/ipc-benchmark/allocations.mjs
```

Use several fresh processes per variant, balance variant order, and retain the complete sampling trees. Never compare profiled elapsed times with unprofiled timing results.

## Timing, startup and exploratory tools

`replicate.py` runs fresh-process wall-time experiments from the archived experimental aliases. `run.py` is the initial within-process pilot, which randomizes fixture/variant order and validates results. Batches within one process are correlated. Treat these pilots as exploration; do not claim precise speed improvements from them. The broad direct-clone variant is an experiment on clone-safe fixtures, not a production codec or a guarantee of JSON compatibility.

`prepare-variants.py` compiles frozen experiment `.ts` files with identical ES2024 options and records source/compiler/output hashes. It only accepts named experimental aliases and never overwrites canonical production modules. `--compiler` can point to an existing esbuild when the output root is a frozen runtime.

Use the repository's large-performance workflow for complete-product startup. Compare explicit commits with around 50 paired samples in each cold/warm empty/workspace scenario. Retain failed launches and raw data, report means and medians with intervals, and keep cache policy and readiness definition fixed. A focused RPC instruction or allocation improvement is not a whole-product startup improvement. Functional smoke pass/fail remains useful compatibility evidence; noisy total smoke time is secondary.

## Reuse packaged builds in Actions

The existing `Large Performance Measure` workflow accepts optional `build_run_id`, `before_artifact` and `after_artifact` inputs alongside exact before/after commit references, existing benchmark IDs and a sample count. It verifies each package against the requested commit before running the existing large-performance collectors. It uploads raw results even when a measurement fails and generates the standard offline report. This avoids rebuilding identical commits when collecting follow-up instruction counts or CPU profiles. Artifact expiry still applies. Workflow permissions are read-only for repository contents and Actions artifacts.

## Packaged-product extension API workload

`perf-product-pairs.py` launches isolated packaged applications with the included development extension. Supply `--products` JSON mapping each variant to an absolute ELF application `executable` and its exact `commit`; use the verified extracted package, not the `bin/` CLI wrapper. Each launch has its own profile, extension directory, shared-data directory and Xvfb server. It closes only its own window after writing the result.

The fixture settles after activation, warms the real extension API, collects extension-host garbage and gates whole-application hardware counters around fixed completed calls. `context-unchanged` repeatedly sends an unchanged `setContext` value, `context-changing` alternates it, and `clipboard-64KiB` validates repeated reads of text written into that launch's own Xvfb clipboard. Every API result and the completed logical-call count are checked. These are whole-application API costs, including handlers and background work. Garbage collection is forced only in the extension host; this differs from the isolated two-peer benchmark.

Calibrate with identical-package A/A labels before comparing changes. `--cpu-profile` separately captures the extension host; those results are marked diagnostic and include profiler overhead. Never compare them with unprofiled counters. First verify a small plumbing run and inspect `result.json`/`error.json` before selecting a long campaign.
