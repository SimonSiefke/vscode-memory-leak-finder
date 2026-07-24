# VS Code performance optimization loop

Use the performance lab as an evidence gate, not just a command runner.

## Required sequence

1. Verify that the optimized binary, VS Code source commit, dirty state,
   workbench bundle, and `out-vscode-min` source maps match. Never substitute a
   build because its executable hash happens to match.
2. Run a quick identical-build A/A comparison for the exact scenario and goal.
   Do not request tracked work for calibration.
3. Stop scoring claims when A/A is invalid, lacks semantic `code/*` phase
   marks, or launches a forbidden core-workload process. If A/A is valid except
   that it cannot detect the requested effect, either use hosted scoring or
   enter the mechanism-exploration mode below.
4. If local A/A is too noisy, use the dedicated hosted workflow. Never compare
   absolute measurements from separate jobs or machines.
5. Establish diagnostics separately from scoring. Rank original-source
   hotspots and calculate an Amdahl upper bound before selecting a source
   change.
6. Make one scoped change in a disposable VS Code worktree, build optimized
   output with matching maps, and run targeted VS Code tests. Run a same-runner
   comparison only when the change's Amdahl estimate is large enough for the
   calibrated environment to detect.
7. Collect targeted calls and allocations only after scoring has not already
   rejected or invalidated the candidate. Treat deterministic reductions as
   mechanism evidence, not a user-visible speed claim.
8. Revert losers. Confirm a promising batch with the hosted 5-replica,
   50-block tier before describing it as a user-visible improvement.

## Mechanism exploration on a noisy host

An underpowered but otherwise valid A/A run may still be used to discover
deterministic work reductions. This mode never produces a `proxy-win` or
user-visible performance claim by itself.

1. Diagnose one action separately from scoring and select a source-mapped
   hotspot inside the renderer action window.
2. Prefer genuine work elimination: redundant calls, allocations, DOM writes,
   or synchronous layout reads. Do not delay, debounce, schedule, disable, or
   move required work beyond DOM-ready.
3. Use one stable, narrow tracker include set. Run all baseline samples before
   candidate samples because changing source path, mode, or includes invalidates
   the prepared-runtime cache.
4. Require at least three samples per arm. Attribute only counters whose
   per-source variation is at most 2%; exclude noisy shared helper sources.
   Unstable counters with identical arm medians are ignored, while an unstable
   counter that claims any baseline/candidate delta invalidates that mechanism.
5. Preserve exact before/after counts, source locations, the candidate patch,
   its SHA-256, tests, build fingerprints, and an Amdahl estimate.
6. If the estimate is below the calibrated minimum detectable effect, do not
   spend a full timing run on the individual change. Revert the worktree and
   queue the patch as a `mechanism-candidate`.
7. Combine only compatible, independently proven mechanism candidates. Submit
   the batch to hosted quick scoring when its estimated effect is large enough
   to detect.

A mechanism candidate is not retained VS Code source and is not a proxy win.
The `proxy-win` gate still requires deterministic work to decrease and the
latency confidence interval's upper bound to be at most +2%.

## Optimized VS Code build

Before modifying VS Code, preserve a clean detached baseline source tree and
its `out-vscode-min` maps. For a scoped desktop candidate, use the current
optimized bundler:

```sh
node build/next/index.ts bundle \
  --out out-vscode-min \
  --target desktop \
  --minify \
  --mangle-privates \
  --nls
```

Stage the resulting desktop `out-vscode-min` into a separate copy of the
matching optimized runtime. Verify the executable, workbench bundle, maps,
product commit, source commit, dirty state, and source-map `sourcesContent`.
The baseline and candidate should differ only in intended original sources.

Do not silently substitute `compile-build-with-mangling` or `gulp core-ci`.
Record their failures if encountered; they also build unrelated targets and
can fail independently of a valid scoped desktop bundle.

## Stop and report

Report the exact artifact path and stop when any of these occur:

- identical-build confidence intervals exclude zero;
- the minimum detectable effect exceeds the target and neither hosted scoring
  nor explicit mechanism exploration is being used;
- product/source/map identity is missing or mismatched;
- `phaseBreakdown` is empty;
- the process manifest contains bundled Copilot or other excluded work;
- correctness/readiness fails or the scenario/harness hash changes;
- deterministic work varies by more than 2% from its per-source median.

Do not weaken the benchmark, include profiler-enabled samples in scoring, or
retain a VS Code patch without at least a `proxy-win` verdict.
