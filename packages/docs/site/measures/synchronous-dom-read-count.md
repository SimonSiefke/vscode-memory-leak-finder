# synchronous-dom-read-count

From the repository root, run one scenario with this copyable command:

```sh
node packages/cli/bin/test.js --cwd packages/e2e --only editor-open.ts --runs 1 --check-leaks --measure-after --measure synchronous-dom-read-count
```

The command uses the Node version in `.nvmrc`; install the repository workspaces first with `npm run install:ci`. The first run downloads VS Code and may need a desktop display. `editor-open.ts` selects that single scenario. The diagnostic returns `isLeak: false`; it does not impose a performance threshold.

Counts successful reads of covered geometry/style APIs in the selected browser realm. Covers HTMLElement offset geometry; Element client/scroll geometry; Element and Range rectangle methods; and getComputedStyle. Setters remain untouched. Reads can occur without triggering layout. Other frames, navigation to a new context, and previously captured method references are outside coverage. Count mode does not construct caller stacks.

JSON results retain numeric metrics and ranked rows. After a successful run, `npm run build-charts` generates separate count and duration charts with run labels under `.vscode-charts`. This diagnostic is not part of every standard CI chart set, so the generated chart uses your own captured results. Instrumented elapsed times include observation overhead; compare equivalent scenarios using the same instrumentation. These measures start when the scenario measurement starts, not at process launch.
