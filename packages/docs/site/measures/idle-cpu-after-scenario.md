# Idle CPU after scenario

`idle-cpu-after-scenario` reports CPU time that Chromium-managed processes spend while VS Code should be idle. It samples `SystemInfo.getProcessInfo` on the root browser connection, waits a fixed 3000 ms window, and samples again, once before the measured runs and once after them. It finds leaked animation loops, polling and timers that keep burning CPU after a scenario has finished, even though they do not show up in a heap snapshot.

```sh
node packages/cli/bin/test.js --cwd packages/e2e --only '^base.ts' --runs 2 \
  --measure idle-cpu-after-scenario --measure-after --timeout-between 2000
```

The `--measure-after` and `--timeout-between` options are recommended so that both windows follow the same kind of state: the pre-scenario window runs after the warm-up runs, and the post-scenario window runs after the last measured run and the timeout. The post-scenario window runs before the scenario's `teardown`, so work that only `teardown` cancels still shows.

The result has one row per process present in all four samples, with `type`, `id` (OS process id), `idleCpuBeforeMs`, `idleCpuAfterMs` and `deltaMs`. It also has per-type totals in `types`, and overall `idleCpuBeforeMs`, `idleCpuAfterMs` and `deltaMs`. Processes that started, exited or reused an id between samples are listed in `unmatchedProcesses` and are excluded from the totals. Chromium reports CPU time in seconds with 10 ms resolution.

The result is informational (`isLeak` is always `false`). Rows are sorted by `deltaMs`; compare them against `base` using the same flags. An idle VS Code typically uses well under 100 ms per process in one window. Delayed startup work can still land in the first window of short scenarios. On VS Code 1.147.0, one utility process did 0.3 to 0.5 s of one-off work about 10 s after launch. That shows up as a large negative `deltaMs` and lowers the overall totals, so look at the largest positive per-process rows rather than only the total. Do not combine this with `--record-video`.

## Scope

- Only Chromium-managed processes are covered: the browser (main) process, renderers, GPU, network and `utility` processes such as the extension host, shared process and pty host (`node.mojom.NodeService`). Plain child processes such as language servers and shells are not listed.
- The measure needs the root browser connection of an Electron app. With `--measure-node`, `--inspect-extensions`, `--inspect-shared-process` or `--inspect-ptyhost`, or when `SystemInfo.getProcessInfo` returns an error, the result has `supported: false` and an `unsupportedReason`.
- `e2e/src/idle-cpu-leaked-interval.ts` is an opt-in positive control. Its extension leaks a 5% CPU interval per run. Run it with `--enable-extensions --run-skipped-tests-anyway`.
