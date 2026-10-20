# Electron lifecycle e2e tests

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

## Heap usage

Sample the main process's V8 heap usage after garbage collection, before the first
measured cycle and after every cycle:

```sh
npm run e2e:electron -- --measure heap-usage --runs 37
```

Results under `electron-main/heap-usage` contain `heapUsage.samples` (cycle number,
used bytes, and allocated heap bytes), baseline/final samples, and a signed byte
delta. This run does not enable the debugger or take heap snapshots, so snapshot
analysis does not affect the usage samples. `--check-leaks` applies only to the
function measurement; heap usage is reported for trend analysis without an automatic
leak verdict. Early growth can be initialization or caches. Repeat with a longer
warmup, for example `--warmup 37`, to assess whether later cycles keep growing.

## Additional lifecycle scenarios

Use `--only <scenario>` to select an API lifecycle. Each cycle waits for the
resource to become ready and for its destruction or exit before sampling.

| Scenario                                | Measured cycle                                                                                                                                                                    |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `webcontentsview-add-remove`            | Attach a new WebContentsView to a persistent BrowserWindow, load it, remove it, and explicitly close its webContents. The host window is created in setup and closed in teardown. |
| `utility-process-create-kill`           | Fork an Electron utility process, receive its ready message, kill it, and await exit.                                                                                             |
| `node-process-create-kill`              | Spawn the runner's actual Node executable, receive readiness on stdout, kill it, and await process/stdio closure.                                                                 |
| `worker-thread-create-terminate`        | Create a Node worker thread in the main process, receive readiness, terminate it, and verify the thread ID becomes -1.                                                            |
| `offscreen-render-close`                | Create an offscreen BrowserWindow, load a local page, await a nonempty painted bitmap, stop painting, close the window, and verify webContents destruction.                       |
| `message-channel-roundtrip-close`       | Send and verify a MessageChannelMain message, then close both ports and await peer disconnection.                                                                                 |
| `ipc-handle-invoke-remove`              | Register and invoke a main-process IPC handler from a persistent local renderer, remove it, then register/invoke/remove a replacement to verify cleanup.                          |
| `protocol-handle-fetch-unhandle`        | Register a handler in a reused in-memory session, fetch and consume its response, unhandle the scheme, and verify registration is gone.                                           |
| `web-request-intercept-remove`          | Intercept a request to a local HTTP server, consume its response, remove the listener, and verify a second request does not invoke it.                                            |
| `cookie-set-get-remove`                 | Set and read a cookie in a reused in-memory session, remove it, and verify absence.                                                                                               |
| `debugger-attach-command-detach`        | Attach the webContents debugger to a persistent local renderer, evaluate a command, detach, and verify attachment is gone.                                                        |
| `menu-install-restore`                  | Create/install a menu, exercise its action callback, and restore the previous application menu.                                                                                   |
| `native-image-create-transform-release` | Create, resize, crop, and PNG-encode NativeImage objects; drop the local wrappers for collection.                                                                                 |

The process and thread fixtures stay alive until explicitly terminated. The view
scenario checks that only the host webContents remains; the offscreen scenario
checks that no webContents remains. Event waits are bounded and remove their
listeners on completion or failure.

```sh
npm run e2e:electron -- --only webcontentsview-add-remove --measure named-function-count3 --runs 37
npm run e2e:electron -- --only worker-thread-create-terminate --measure heap-usage --warmup 37 --runs 37
```

Function-count and heap-usage measurements target the launched Electron **main
process**, covering parent-side API wrappers and lifecycle bookkeeping. The
`native-memory` measure below additionally covers application process footprints
and Chromium allocation counters.

API references: [WebContentsView](https://www.electronjs.org/docs/latest/api/web-contents-view),
[utilityProcess](https://www.electronjs.org/docs/latest/api/utility-process), and
[offscreen rendering](https://www.electronjs.org/docs/latest/tutorial/offscreen-rendering).

The IPC/debugger renderer loads only a local data URL; Node integration is enabled
for that fixture so IPC calls exercise the real renderer-to-main path. Fetch tests
use an in-memory session and local/custom-protocol responses. The web-request
server and host windows are created in setup and closed in teardown. NativeImage
function-count checks cover JavaScript wrappers; use `native-memory` to assess
pixel storage as well.

## Native and graphics memory

On Linux, collect process footprints and Chromium allocator counters with:

```sh
npm run e2e:electron -- --only offscreen-render-close --measure native-memory --warmup 37 --runs 185
```

`native-memory` records PID/start-time-validated `/proc/<pid>/smaps_rollup` PSS,
RSS, and private memory for the launched application's processes, classified as
main, GPU, renderer, utility, or other. Root process-tree discovery at checkpoints
also finds children absent from Electron's app metrics. Each cycle collects main-process garbage
before sampling; renderer heaps are not explicitly collected. Node's external-memory counters are recorded alongside footprints.

Detailed Chromium MemoryInfra traces are captured at baseline, every 37 cycles,
at the end, and after a five-second idle period. The result includes live
`malloc/allocated_objects` bytes and the reported GPU allocator root size, plus
individual graphics allocator rows. Parent and child allocator sizes are not added
together. Missing counters remain `null`; they are not treated as zero. Tracing is
primed before baseline and is stopped between checkpoints. Raw traces remain in
the run's artifact directory.

Use process-tree PSS for totals; summed RSS double-counts shared mappings.
Footprints include JavaScript, native allocations, code, mappings, and retained
allocator capacity; footprint growth alone does not establish a native leak.
Live malloc counters also do not cover every allocation path: native Buffer
storage, for example, is additionally tracked by external-memory counters and OS
footprints. Graphics counters describe Chromium-tracked allocations, and GPU-process
PSS/RSS describes that process's host memory, not physical GPU VRAM.

`--software-gpu` requests ANGLE/SwiftShader so graphics allocations can be exercised
on machines without usable hardware acceleration. Results include the requested
mode, GPU capabilities, and the actual WebGL renderer probe. Software-renderer
results cannot validate physical GPU-driver/VRAM leaks.

The NativeImage scenario uses 512×512 source bitmaps so accumulating native pixel
storage would have a meaningful signal. Two additional positive controls are
selected explicitly:

```sh
npm run e2e:electron -- --only retained-native-buffer --measure native-memory --runs 8
npm run e2e:electron -- --only retained-gpu-texture --measure native-memory --software-gpu --runs 4
```

The first retains one touched MiB of Buffer storage per cycle; the second retains
a renderer and a committed 4 MiB WebGL texture per cycle. `idle` is an overhead
control. `--check-leaks` remains specific to the function-count measurement;
native/graphics data is reported for trend and allocator analysis.

For diagnostic controls, `--js-flags=--jitless` disables V8 JIT compilation and
`--skip-native-traces` retains process-footprint sampling while omitting MemoryInfra
captures. These controls help distinguish code/cache growth and tracing overhead
from API retention; omitted allocator counters remain unavailable in the result.
Native measurements default to `electron-app/native-memory` under the results
root; function and heap measurements remain under `electron-main`.
