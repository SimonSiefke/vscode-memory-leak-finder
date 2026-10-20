# Electron main-process e2e tests

Run a standalone generated Electron app and measure its main process:

```sh
npm run e2e:electron -- --only window-open-close --measure named-function-count3 --runs 5 --check-leaks
```

This runner uses Node.js 24 or newer and the repository's installed dependencies.
Electron needs the usual desktop libraries and a display. On Linux without a display:

```sh
xvfb-run -a npm run e2e:electron -- --runs 5 --check-leaks
```

Use `--no-sandbox` when the execution environment requires disabling Electron's sandbox.
The fixture pins Electron in `fixture/package.json` and `fixture/package-lock.json`.

## Workspace cache

The first run copies the fixture to `$XDG_CACHE_HOME/electron-memory-leak-finder`
(or `~/.cache/electron-memory-leak-finder`) and installs Electron there. Subsequent
runs reuse that workspace without npm or a download. The cache key includes the
fixture files, lockfile, OS, and architecture. Changing these creates a new cache
entry. `--cache-dir <path>` overrides the cache location.

Installation uses a lock and publishes a completed staging directory, so concurrent
runners cannot use a partially installed workspace. Failed installs release the
lock and remove staging files. If an installer is forcibly killed, remove its
reported `.lock` directory before retrying. Cached workspaces can be removed to
reclaim disk space; the next run recreates them.

Each launch has separate user data and snapshot files. Concurrent runs can share
the installed Electron runtime. Runs of the same scenario keep separate artifacts;
the top-level scenario JSON is replaced by whichever run finishes last.

## Process selection and measurement

The runner launches the cached Electron executable with `--inspect=127.0.0.1:0`.
It connects to the inspector URL printed by that child, then verifies that
`process.pid` equals the spawned PID, `process.type` is `browser` (Electron's main
process), and `process.versions.electron` exists. It launches no VS Code instance
and performs no existing-process discovery. Electron documents this inspector as
its [main-process debugging interface](https://www.electronjs.org/docs/latest/tutorial/debugging-main-process).

Two warmup cycles run before the baseline (`--warmup <n>` changes this). The runner
collects garbage and takes a main-process heap snapshot before and after the measured
cycles. It uses the same function comparison as `named-function-count3`, with the
app's own script map and no VS Code source exclusions. Locations whose function
count grows by at least the number of measured cycles are reported as potential
leaks. This is evidence of retained functions, not proof of an unbounded leak, and
does not cover renderer heaps or native window memory.

The window scenario creates a visible BrowserWindow, loads a local data URL, closes
it, waits for destruction, and verifies that no windows or webContents remain. The
app deliberately stays alive with zero windows so all cycles use the same main process.

Results are written to:

```text
.vscode-memory-leak-finder-results/electron-main/named-function-count3/<scenario>.json
```

A unique adjacent directory retains both heap snapshots, the script map, a copy of
the result, and the app's user data. `--results-dir <path>` overrides the directory.
JSON includes the Electron version, PID, cycle counts, and `namedFunctionCount3`
array. `--check-leaks` exits with code 1 if that array is nonempty. These artifacts
can be large and can be deleted after analysis.

## Add a scenario

Create `scenarios/<name>.ts` exporting `run(context)` and optionally `setup(context)`
and `teardown(context)`. `context.evaluate(expression)` executes JavaScript in the
verified main process and awaits promises. Keep fixture operations in `fixture/main.cjs`
so creating inspector evaluation scripts does not itself create per-cycle function
locations. Teardown runs after measurement, including when setup or a cycle fails.
The runner disconnects the inspector and terminates the launched app on completion
or failure.

A deliberately leaking positive control verifies that the measurement detects
functions in the correct process:

```sh
npm run e2e:electron -- --only retained-function --runs 3 --check-leaks
```

This should report `electronE2ERetainedFunction` with delta 3 and exit with code 1.
It is selected explicitly and does not run with the default window scenario.

```sh
npm --prefix packages/electron-e2e test
npm --prefix packages/electron-e2e run type-check
```
