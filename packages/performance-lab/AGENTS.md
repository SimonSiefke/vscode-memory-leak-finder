# VS Code performance optimization loop

Use the performance lab as an evidence gate, not just a command runner.

## Required sequence

1. Verify that the optimized binary, VS Code source commit, dirty state,
   workbench bundle, and `out-vscode-min` source maps match. Never substitute a
   build because its executable hash happens to match.
2. Run a quick identical-build A/A comparison for the exact scenario and goal.
   Do not request tracked work for calibration.
3. Stop without profiling or editing VS Code when A/A is invalid, cannot detect
   the requested effect, lacks semantic `code/*` phase marks, or launches a
   forbidden core-workload process.
4. If local A/A is too noisy, use the dedicated hosted workflow. Never compare
   absolute measurements from separate jobs or machines.
5. Establish diagnostics separately from scoring. Rank original-source
   hotspots and calculate an Amdahl upper bound before selecting a source
   change.
6. Make one scoped change in a disposable VS Code worktree, build optimized
   output with matching maps, run targeted VS Code tests, then run the
   same-runner 12-block comparison.
7. Collect targeted calls and allocations only after scoring has not already
   rejected or invalidated the candidate. Treat deterministic reductions as
   mechanism evidence, not a user-visible speed claim.
8. Revert losers. Confirm a promising batch with the hosted 5-replica,
   50-block tier before describing it as a user-visible improvement.

## Stop and report

Report the exact artifact path and stop when any of these occur:

- identical-build confidence intervals exclude zero or have a minimum
  detectable effect larger than the requested target;
- product/source/map identity is missing or mismatched;
- `phaseBreakdown` is empty;
- the process manifest contains bundled Copilot or other excluded work;
- correctness/readiness fails or the scenario/harness hash changes;
- deterministic work varies by more than 2% from its per-source median.

Do not weaken the benchmark, include profiler-enabled samples in scoring, or
retain a VS Code patch without at least a `proxy-win` verdict.
