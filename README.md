# VSCode Memory Leak Finder

Find memory leaks in vscode to improve robustness and performance.

## Quickstart

```sh
git clone git@github.com:SimonSiefke/vscode-memory-leak-finder.git &&
cd vscode-memory-leak-finder &&
npm ci &&
npm run e2e
```

## Gitpod

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io#https://github.com/SimonSiefke/vscode-memory-leak-finder)

## Measures

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

### SetTime

Measures the total number of Timeouts.

```sh
node packages/cli/bin/test.js --cwd packages/e2e  --check-leaks --measure-after --measure set-timeout --only base
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
| GettingStarted       | https://github.com/microsoft/vscode/issues/216858 | Review |
| SettingEnumRenderer  | https://github.com/microsoft/vscode/pull/216855   | Fixed  |
| SettingsEditor2      | https://github.com/microsoft/vscode/pull/216763   | Fixed  |

## Credits

This project is based on the [jest cli](https://github.com/jestjs/jest), [playwright](https://github.com/microsoft/playwright/) and [fuite](https://github.com/nolanlawson/fuite).
