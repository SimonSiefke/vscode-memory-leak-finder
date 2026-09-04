# VSCode Memory Leak Finder

Find memory leaks in vscode to improve robustness and performance.

## Quickstart

```sh
git clone git@github.com:SimonSiefke/vscode-memory-leak-finder.git &&
cd vscode-memory-leak-finder &&
npm ci &&
npm run e2e
```

## Sharding

Split the selected test files across parallel jobs with the Jest-compatible, one-based `--shard=<index>/<count>` option:

```sh
node packages/cli/bin/test.js --cwd packages/e2e --measure promises-with-stack-trace --shard=1/2
node packages/cli/bin/test.js --cwd packages/e2e --measure promises-with-stack-trace --shard=2/2
```

Each test file belongs to exactly one shard. Results from separate jobs can be downloaded into directories whose names start with
`vscode-memory-leak-finder-results-linux-` and combined with:

```sh
node packages/build/src/mergeArtifacts.ts
```

<!--  -->

## Memory-leak issue radar

Generate a self-contained HTML overview of memory-leak issues across popular
JavaScript, TypeScript, and Node.js repositories:

```sh
npm run memory-leak-report
open .memory-leak-report/index.html
```

The generator uses GitHub GraphQL to discover repositories with at least 5,000
stars, filters them to projects with a root `package.json`, and scans up to 600
repositories by default. It searches each issue tracker's titles and bodies for
the phrase `"memory leak"`. Docusaurus and Rspack are included as seed
repositories. Authentication comes from `GITHUB_TOKEN`, `GH_TOKEN`, or the
active `gh` CLI login.

GitHub requests are sequential and paced by 750 milliseconds. The generator
automatically retries transient and secondary-rate-limit responses, and waits
for the primary GraphQL limit to reset before it is exhausted. Use
`--request-delay-ms` to adjust the pacing when needed.

Repositories on the built-in denylist are skipped by owner or repository name,
with case and punctuation ignored. Pass `--include-ignored` to include them;
passing one explicitly with `--repo owner/name` also overrides the denylist.

The HTML report works directly from disk. It includes repository search and
sorting, exact open/closed match counts, and a two-column issue board. Common
options include:

```sh
npm run memory-leak-report -- --min-stars 1000 --max-repos 100
npm run memory-leak-report -- --repo owner/project --issues-per-state 50
npm run memory-leak-report -- --no-seed-repos --output /tmp/memory-leaks.html
```

## Measures

### PendingPromisesWithRetainers

Finds pending Promises added during a test and reports their shortest strong path from a GC root, together with per-path counts and retained bytes. Inspector query handles are released before the final heap snapshot.

```sh
node packages/cli/bin/test.js --cwd packages/e2e --check-leaks --measure-after --measure pending-promises-with-retainers --only base
```

### RetainedBytesBySource

Ranks allocation sources by the bytes they still own after garbage collection. Source-map-aware results include surviving allocation count, dominated object count, and retained bytes.

```sh
node packages/cli/bin/test.js --cwd packages/e2e --check-leaks --measure-after --measure retained-bytes-by-source --only base
```

### NativeContextCount

Measures live V8 native contexts from before and after heap snapshots. A growing count can reveal leaked windows, workers, realms, or VM contexts.

```sh
node packages/cli/bin/test.js --cwd packages/e2e --check-leaks --measure-after --measure native-context-count --only base
```

### ActiveAsyncResourcesWithStackTraces

Tracks Node async resources created during the test and reports resources that remain active, grouped by resource type and creation stack. The tracker stores metadata only and removes its hook during capture.

```sh
node packages/cli/bin/test.js --cwd packages/e2e --check-leaks --measure-after --measure active-async-resources-with-stack-traces --only base
```

### ObjectShapeDifference

Compares V8 object shapes before and after a test. Results identify constructor, prototype, elements kind, descriptor names, shape-count delta, and live-instance delta.

```sh
node packages/cli/bin/test.js --cwd packages/e2e --check-leaks --measure-after --measure object-shape-difference --only base
```

### ObjectUrlCount

Spies on `URL.createObjectURL` and `URL.revokeObjectURL` from renderer startup and reports cumulative call counts plus the number of created object URLs that are still active after each test.

```sh
node packages/cli/bin/test.js --cwd packages/e2e --check-leaks --measure-after --measure object-url-count --only base
```

### MemoryCity

Captures allocation-aware renderer and extension-host heap snapshots, computes
source-mapped retained ownership, and generates the interactive VS Code Memory
City visualization.

```sh
node packages/cli/bin/test.js --cwd packages/e2e --check-leaks --measure-after --measure memory-city --only base
```

Build or preview the standalone viewer:

```sh
npm --prefix packages/visualizations run build
npm --prefix packages/visualizations run dev
```

### ChromiumMemoryDump

Captures two detailed Chromium MemoryInfra snapshots around a browser scenario. The informational result compares per-process private footprint and detailed allocator paths, retains normalized allocator attributes and ownership edges, and reports trace completeness without storing the full raw trace. Because allocator paths are hierarchical, their sizes are not additive.

```sh
node packages/cli/bin/test.js --cwd packages/e2e --check-leaks --measure-after --measure chromium-memory-dump --only base
npm run build-charts
```

The generated process and allocator charts are written to `.vscode-charts/chromium-memory-dump-processes` and `.vscode-charts/chromium-memory-dump-allocators`.

### ArrayBufferBytes

Measures the native backing-store bytes retained by live `ArrayBuffer` objects. The result includes before, after, and delta byte and backing-store counts.

```sh
node packages/cli/bin/test.js --cwd packages/e2e --check-leaks --measure-after --measure array-buffer-bytes --only base
```

### PerformanceMarkCounts

Measures the number of native Chromium `PerformanceMark` objects before and after a browser scenario. The generated chart shows the initial count in black and growth in red.

```sh
node packages/cli/bin/test.js --cwd packages/e2e --check-leaks --measure-after --measure performance-mark-counts --only base
npm run build-charts
```

### PerformanceMarkBytes

Measures the native self-size bytes retained by Chromium `PerformanceMark` objects before and after a browser scenario. The generated chart shows the initial bytes in black and growth in red.

```sh
node packages/cli/bin/test.js --cwd packages/e2e --check-leaks --measure-after --measure performance-mark-bytes --only base
npm run build-charts
```

### ArrayCount

Measures the total number of arrays.

```sh
node packages/cli/bin/test.js --cwd packages/e2e  --check-leaks --measure-after --measure array-count --only base
```

### ArrayElementCount

Measures the total number of elements in all arrays.

```sh
node packages/cli/bin/test.js --cwd packages/e2e  --check-leaks --measure-after --measure array-element-count --only base
```

### ClassCount

Measures the total number of classes.

```sh
node packages/cli/bin/test.js --cwd packages/e2e  --check-leaks --measure-after --measure class-count --only base
```

### CompiledCodeSize

Measures V8 compiled-code bytes from before and after heap snapshots. Results include the exact total, attributed/shared/unattributed buckets, and rankings by function size and growth.

```sh
node packages/cli/bin/test.js --cwd packages/e2e --measure-after --measure compiled-code-size --only base
```

### ConcatenatedErrorStringCount

Measures V8 concatenated-string nodes whose bounded prefix is an `Error`-style
stack trace. The result includes before/after matching counts and diagnostic
totals for all concatenated strings; stack contents are not written to the
result.

```sh
node packages/cli/bin/test.js --cwd packages/e2e --check-leaks --measure-after --measure concatenated-error-string-count --only base
```

### ConcatenatedStrings

Measures V8 concatenated-string nodes and reconstructs their values when the
heap snapshot contains enough rope data. The before/after data is an array of
strings, with V8's node name used when a value cannot be reconstructed.

```sh
node packages/cli/bin/test.js --cwd packages/e2e --check-leaks --measure-after --measure concatenated-strings --only base
```

### CpuPerformanceCounters

Measures CPU instructions and cycles for the inspected process.

```sh
node packages/cli/bin/test.js --cwd packages/e2e  --check-leaks --measure-after --measure cpu-performance-counters --only base
```

### LinuxProcessTreeResources

On Linux, measures CPU activity and aggregate proportional memory for the Electron main process and its descendants during the scenario. CPU data comes from inherited `perf stat` counters. Memory data comes from the sum of `/proc/<pid>/smaps_rollup` PSS sampled every 250 ms, so `sampledPeakPssMiB` can miss shorter spikes. The result is informational and never reports a leak.

```sh
node packages/cli/bin/test.js --cwd packages/e2e --measure-after --measure linux-process-tree-resources --only base
```

### LinuxProcessTreeResourcesFromStart

Measures the same process-tree resources from Electron launch through scenario completion. Use `--startup-runs` to restart Electron and aggregate every numeric metric across independent samples.

```sh
node packages/cli/bin/test.js --cwd packages/e2e --measure-after --measure linux-process-tree-resources-from-start --startup-runs 5 --only base
```

Both measures run collection and parsing in a dedicated Linux process-tree worker. The caller starts it with the process-tree root PID, receives the parsed result when stopping it, and disposes the worker immediately after measurement. They require Linux, `perf`, access to the requested perf events, and readable `smaps_rollup` files. Missing facilities or permissions fail the measure instead of producing zero-valued counters. GNU `time` is intentionally not used because its maximum RSS is not the simultaneous sum of Electron's processes.

### DetachedDomNodeCount

Measures the total number of detached dom nodes.

```sh
node packages/cli/bin/test.js --cwd packages/e2e  --check-leaks --measure-after --measure detached-dom-node-count --only base
```

### DomCounters

Measures dom nodes, jsEventListeners and documents.

```sh
node packages/cli/bin/test.js --cwd packages/e2e  --check-leaks --measure-after --measure dom-counters --only base
```

### DomNodeCount

Measures the total number of dom nodes.

```sh
node packages/cli/bin/test.js --cwd packages/e2e  --check-leaks --measure-after --measure dom-node-count --only base
```

### DuplicatedStrings

Measures flat string values represented by more than one V8 heap node. Each
duplicated value occurs once in the before/after string arrays.

```sh
node packages/cli/bin/test.js --cwd packages/e2e --check-leaks --measure-after --measure duplicated-strings --only base
```

### EditContextCount

Measures the total number of edit context.

```sh
node packages/cli/bin/test.js --cwd packages/e2e  --check-leaks --measure-after --measure edit-context-count --only base
```

### EventListenerCount

Measures the total number of event listeners.

```sh
node packages/cli/bin/test.js --cwd packages/e2e  --check-leaks --measure-after --measure event-listener-count --only base
```

### EventListeners

Measures the event listeners.

```sh
node packages/cli/bin/test.js --cwd packages/e2e  --check-leaks --measure-after --measure event-listeners --only base
```

### FinalizationRegistryCount

Measures the total number of live `FinalizationRegistry` instances.

```sh
node packages/cli/bin/test.js --cwd packages/e2e --check-leaks --measure-after --measure finalization-registry-count --only base
```

### FunctionCount

Measures the total number of functions.

```sh
node packages/cli/bin/test.js --cwd packages/e2e  --check-leaks --measure-after --measure function-count --only base
```

### GlobalLexicalScopeNames

Measures global variables / global lexical scope names.

```sh
node packages/cli/bin/test.js --cwd packages/e2e  --check-leaks --measure-after --measure global-lexical-scope-names --only base
```

### GlobalPropertyDifference

Reports own string-named properties added to `globalThis` during the measured scenario. Global lexical bindings are covered separately by `global-lexical-scope-names`.

```sh
node packages/cli/bin/test.js --cwd packages/e2e --check-leaks --measure-after --measure global-property-difference --only base
```

### HeapUsage

Measures heap usage.

```sh
node packages/cli/bin/test.js --cwd packages/e2e  --check-leaks --measure-after --measure heap-usage --only base
```

### InstanceCounts

Measures the number of instances of each class.

```sh
node packages/cli/bin/test.js --cwd packages/e2e  --check-leaks --measure-after --measure instance-counts --only base
```

### IntersectionObserverCount

Measures the number of intersection observers.

```sh
node packages/cli/bin/test.js --cwd packages/e2e  --check-leaks --measure-after --measure intersection-observer-count --only base
```

### MapSize

Measures the total number of elements in all Maps.

```sh
node packages/cli/bin/test.js --cwd packages/e2e  --check-leaks --measure-after --measure map-size --only base
```

### MediaQueryListCount

Measures the total number of MediaQueryLists.

```sh
node packages/cli/bin/test.js --cwd packages/e2e  --check-leaks --measure-after --measure media-query-list-count --only base
```

### MutationObserverCount

Measures the total number of MutationObservers.

```sh
node packages/cli/bin/test.js --cwd packages/e2e  --check-leaks --measure-after --measure mutation-observer-count --only base
```

### NamedFunctionCount

Measures the count of each function.

```sh
node packages/cli/bin/test.js --cwd packages/e2e  --check-leaks --measure-after --measure named-function-count --only base
```

### NamedFunctionDifference

Measures the difference in counts of each function.

```sh
node packages/cli/bin/test.js --cwd packages/e2e  --check-leaks --measure-after --measure named-function-difference --only base
```

### PromiseCount

Measures the total number of Promises.

```sh
node packages/cli/bin/test.js --cwd packages/e2e  --check-leaks --measure-after --measure promise-count --only base
```

### RegexCount

Measures the total number of Regex instances.

```sh
node packages/cli/bin/test.js --cwd packages/e2e  --check-leaks --measure-after --measure regex-count --only base
```

### ResizeObserverCount

Measures the total number of ResizeObservers.

```sh
node packages/cli/bin/test.js --cwd packages/e2e  --check-leaks --measure-after --measure resize-observer-count --only base
```

### SetSize

Measures the total number of elements in all Sets.

```sh
node packages/cli/bin/test.js --cwd packages/e2e  --check-leaks --measure-after --measure set-size --only base
```

### SetTimeout

Measures the total number of Timeouts.

```sh
node packages/cli/bin/test.js --cwd packages/e2e  --check-leaks --measure-after --measure set-timeout --only base
```

### TrackedTimeouts

Measures active timeouts using workbench instrumentation installed at application startup.

```sh
node packages/cli/bin/test.js --cwd packages/e2e --runs 1 --measure-after --measure tracked-timeouts --timeout-between 5000 --only base
```

### TrackedAllocationLeaks

Reports allocation sites that retain instances after forced garbage collection. Results are informational potential leak candidates.

```sh
node packages/cli/bin/test.js --cwd packages/e2e --measure tracked-allocation-leaks --only editor-open
```

### TrackedAllocationPerformance

Correlates allocation churn with sampled JavaScript CPU self-time by source file. The CPU percentage describes the source file, not the cost of allocation itself.

```sh
node packages/cli/bin/test.js --cwd packages/e2e --measure tracked-allocation-performance --only editor-type-many-characters
```

### V8TurbofanStats

Measures V8 TurboFan optimization and deoptimization activity.

```sh
node packages/cli/bin/test.js --cwd packages/e2e  --check-leaks --measure-after --measure v8-turbofan-stats --only base
```

### WeakMapCount

Measures the total number of WeakMaps.

```sh
node packages/cli/bin/test.js --cwd packages/e2e  --check-leaks --measure-after --measure weak-map-count --only base
```

### WeakSetCount

Measures the total number of WeakSets.

```sh
node packages/cli/bin/test.js --cwd packages/e2e  --check-leaks --measure-after --measure weak-set-count --only base
```

### WindowCount

Measures the total number of Windows.

```sh
node packages/cli/bin/test.js --cwd packages/e2e  --check-leaks --measure-after --measure window-count --only base
```

## Project Structure

- packages/charts: Visualizations for test output
- packages/cli: Command Line Interface, similar to jest
- packages/devtools-protocol: Functionality related to Chrome Devtools Protocol
- packages/e2e: The e2e test scenarios
- packages/file-watcher-worker: Watch files for changes
- packages/injected-code: Code injected to the page for e2e tests
- packages/memory-leak-finder: Library for finding memory leaks
- packages/memory-leak-worker: Process for finding memory leaks (uses the library from above)
- packages/page-object: Page Object Model to simplify e2e tests
- packages/source-map-worker: Functions for querying original positions and function names using source maps
- packages/test-coordinator: Determines which tests to run, launches VSCode, file-watcher-worker, test-worker, memory-leak-worker, video-recording-worker
- packages/test-worker: Runs tests
- packages/visualizations: Interactive source-mapped memory visualizations
- packages/test-worker-commands: Functions used by test-worker
- packages/video-recording-worker: Record screencasts of the tests

## How does it work

Before and after a test is executed, all event listeners are queried using Chrome Devtools Protocol `Runtime.queryObjects({ prototypeId: "EventTarget.prototype" })` and `DomDebugger.getEventListeners`.

We get an array of event listeners `before` and `after`, for example

```jsonc
// before
[
  {
    "type": "focusin",
    "description": "()=>this.j()",
    "objectId": "524841679309534768.4.2930",
    "stack": [
      "listener (file:///home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-test/vscode-linux-x64-1.83.1/resources/app/out/vs/workbench/workbench.desktop.main.js:148:37007)",
    ],
    "sourceMaps": [
      "https://ticino.blob.core.windows.net/sourcemaps/f1b07bd25dfad64b0167beb15359ae573aecd2cc/core/vs/workbench/workbench.desktop.main.js.map",
    ],
  },
]
```

and

```jsonc
// after
[
  {
    "type": "focusin",
    "description": "()=>this.j()",
    "objectId": "524841679309534768.4.2930",
    "stack": [
      "listener (file:///home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-test/vscode-linux-x64-1.83.1/resources/app/out/vs/workbench/workbench.desktop.main.js:148:37007)",
    ],
    "sourceMaps": [
      "https://ticino.blob.core.windows.net/sourcemaps/f1b07bd25dfad64b0167beb15359ae573aecd2cc/core/vs/workbench/workbench.desktop.main.js.map",
    ],
  },
  {
    "type": "keydown",
    "description": "N=>{new P.$qO(N).equals(2)&&N.preventDefault()}",
    "objectId": "3680313440875909344.4.4572",
    "stack": [
      "listener (file:///home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-test/vscode-linux-x64-1.83.1/resources/app/out/vs/workbench/workbench.desktop.main.js:244:39878)",
    ],
    "sourceMaps": [
      "https://ticino.blob.core.windows.net/sourcemaps/f1b07bd25dfad64b0167beb15359ae573aecd2cc/core/vs/workbench/workbench.desktop.main.js.map",
    ],
    "originalStack": ["/src/vs/base/browser/ui/menu/menu.ts:122:58"],
  },
]
```

The `before` and `after` arrays are compared to see which event listeners have been added. In the example above, there is one keydown listener more in the `after` array which is not in the `before` array.

The tests are structured in a way one would be expect that the number of event listeners before and after the test are equal. For example, when opening and closing the menu, one would expect the number of event listeners stays equal. This is the menu toggle test:

```js
// title-bar-menu-toggle.js
export const run = async ({ TitleBar }) => {
  await TitleBar.showMenuFile()
  await TitleBar.hideMenuFile()
}
```

Every time the test was executed, event listeners increased by one keydown listener in `/src/vs/base/browser/ui/menu/menu.ts:122:58`, which indicates a memory leak and in this case was precisely the location of the memory leak.

In other cases, the output for memory leaks might not be quite as clear, but maybe still helpful. This is the output for the notebook-open test (opening and closing a notebook):

```json
[
  {
    "type": "contextmenu",
    "description": "n=>{t.$_O.stop(n,!0)}",
    "objectId": "2723967474668247540.4.13637",
    "stack": [
      "listener (file:///home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-test/vscode-linux-x64-1.83.1/resources/app/out/vs/workbench/workbench.desktop.main.js:244:18357)"
    ],
    "sourceMaps": [
      "https://ticino.blob.core.windows.net/sourcemaps/f1b07bd25dfad64b0167beb15359ae573aecd2cc/core/vs/workbench/workbench.desktop.main.js.map"
    ],
    "count": 1,
    "originalStack": ["/src/vs/base/browser/ui/actionbar/actionbar.ts:370:117"]
  },
  {
    "type": "-monaco-gesturetap",
    "description": "r=>this.onClick(r,!0)",
    "objectId": "2723967474668247540.4.13695",
    "stack": [
      "listener (file:///home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-test/vscode-linux-x64-1.83.1/resources/app/out/vs/workbench/workbench.desktop.main.js:244:10198)"
    ],
    "sourceMaps": [
      "https://ticino.blob.core.windows.net/sourcemaps/f1b07bd25dfad64b0167beb15359ae573aecd2cc/core/vs/workbench/workbench.desktop.main.js.map"
    ],
    "count": 1,
    "originalStack": ["/src/vs/base/browser/ui/actionbar/actionViewItems.ts:121:68"]
  },
  {
    "type": "mousedown",
    "description": "r=>{c||I.$_O.stop(r,!0),this._action.enabled&&r.button===0&&o.classList.add(\"active\")}",
    "objectId": "2723967474668247540.4.13697",
    "stack": [
      "listener (file:///home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-test/vscode-linux-x64-1.83.1/resources/app/out/vs/workbench/workbench.desktop.main.js:244:10258)"
    ],
    "sourceMaps": [
      "https://ticino.blob.core.windows.net/sourcemaps/f1b07bd25dfad64b0167beb15359ae573aecd2cc/core/vs/workbench/workbench.desktop.main.js.map"
    ],
    "count": 1,
    "originalStack": ["/src/vs/base/browser/ui/actionbar/actionViewItems.ts:123:70"]
  },
  {
    "type": "click",
    "description": "r=>{I.$_O.stop(r,!0),this.m&&this.m.isMenu||this.onClick(r)}",
    "objectId": "2723967474668247540.4.13699",
    "stack": [
      "listener (file:///home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-test/vscode-linux-x64-1.83.1/resources/app/out/vs/workbench/workbench.desktop.main.js:244:10475)"
    ],
    "sourceMaps": [
      "https://ticino.blob.core.windows.net/sourcemaps/f1b07bd25dfad64b0167beb15359ae573aecd2cc/core/vs/workbench/workbench.desktop.main.js.map"
    ],
    "count": 1,
    "originalStack": ["/src/vs/base/browser/ui/actionbar/actionViewItems.ts:145:65"]
  },
  {
    "type": "dblclick",
    "description": "r=>{I.$_O.stop(r,!0)}",
    "objectId": "2723967474668247540.4.13701",
    "stack": [
      "listener (file:///home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-test/vscode-linux-x64-1.83.1/resources/app/out/vs/workbench/workbench.desktop.main.js:244:10572)"
    ],
    "sourceMaps": [
      "https://ticino.blob.core.windows.net/sourcemaps/f1b07bd25dfad64b0167beb15359ae573aecd2cc/core/vs/workbench/workbench.desktop.main.js.map"
    ],
    "count": 1,
    "originalStack": ["/src/vs/base/browser/ui/actionbar/actionViewItems.ts:154:68"]
  },
  {
    "type": "mouseout",
    "description": "n=>{I.$_O.stop(n),o.classList.remove(\"active\")}",
    "objectId": "2723967474668247540.4.13705",
    "stack": [
      "listener (file:///home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-test/vscode-linux-x64-1.83.1/resources/app/out/vs/workbench/workbench.desktop.main.js:244:10662)"
    ],
    "sourceMaps": [
      "https://ticino.blob.core.windows.net/sourcemaps/f1b07bd25dfad64b0167beb15359ae573aecd2cc/core/vs/workbench/workbench.desktop.main.js.map"
    ],
    "count": 2,
    "originalStack": ["/src/vs/base/browser/ui/actionbar/actionViewItems.ts:159:56"]
  }
]
```

It seems there is memory leak when opening and closing a notebook. But just looking at the output, it's difficult to say much more. It's not clear where exactly the memory leak is and one might need to look more closely at the `actionbar.ts` and `actionViewItems.ts` code.

## Memory Leaks

| Component            | Issue                                             | Status |
| -------------------- | ------------------------------------------------- | ------ |
| Menu                 | https://github.com/microsoft/vscode/issues/195580 | Fixed  |
| Dropdown             | https://github.com/microsoft/vscode/issues/197767 | Fixed  |
| MenuBar              | https://github.com/microsoft/vscode/issues/198051 | Fixed  |
| DefaultWorkerFactory | https://github.com/microsoft/vscode/issues/198709 | Fixed  |
| ExtensionList        | https://github.com/microsoft/vscode/issues/198709 | Fixed  |
| SimpleFindWidget     | https://github.com/microsoft/vscode/issues/199043 | Fixed  |
| ColorPickerWidget    | https://github.com/microsoft/vscode/issues/199814 | Fixed  |
| DiffEditor           | https://github.com/microsoft/vscode/issues/200381 | Fixed  |
| QuickPick            | https://github.com/microsoft/vscode/issues/201320 | Fixed  |
| Terminal             | https://github.com/xtermjs/xterm.js/issues/4935   | Fixed  |
| KeyBindingsEditor    | https://github.com/microsoft/vscode/issues/202455 | Fixed  |
| NotebookEditorWidget | https://github.com/microsoft/vscode/issues/204756 | Fixed  |
| SettingsEditor2      | https://github.com/microsoft/vscode/pull/216763   | Fixed  |
| SettingEnumRenderer  | https://github.com/microsoft/vscode/pull/216855   | Fixed  |
| GettingStarted       | https://github.com/microsoft/vscode/issues/216858 | Fixed  |
| ExtensionTabs        | https://github.com/microsoft/vscode/pull/219726   | Fixed  |
| Output               | https://github.com/microsoft/vscode/pull/221605   | Fixed  |
| StickyScroll         | https://github.com/microsoft/vscode/pull/221622   | Fixed  |
| SelectBox            | https://github.com/microsoft/vscode/pull/221507   | Fixed  |
| DebugView            | https://github.com/microsoft/vscode/pull/225334   | Fixed  |
| SettingsIndicators   | https://github.com/microsoft/vscode/pull/236417   | Fixed  |

## Credits

This project is based on the [jest cli](https://github.com/jestjs/jest), [playwright](https://github.com/microsoft/playwright/) and [fuite](https://github.com/nolanlawson/fuite).
