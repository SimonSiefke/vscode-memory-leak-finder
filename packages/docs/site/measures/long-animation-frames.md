# long-animation-frames

From the repository root, run one scenario with this copyable command:

```sh
node packages/cli/bin/test.js --cwd packages/e2e --only ^settings-open.ts --runs 2 --check-leaks --measure-after --measure long-animation-frames
```

The command uses the Node version in `.nvmrc`; install the repository workspaces first with `npm run install:ci`. The first run downloads VS Code and may need a desktop display. The diagnostic returns `isLeak: false`; it does not impose a performance threshold. Run `base.ts` the same way as a control.

Observes [Long Animation Frame timing](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/Long_animation_frame_timing) in the workbench page with a `PerformanceObserver`. Only frames that start after measurement start are counted; buffered startup frames are ignored. Before the snapshot, the collector waits two animation frames (at most one second) so the last frame is reported.

Metrics are `frameCount`, total and maximum frame duration, total `blockingDuration`, total render time (from `renderStart` to the end of the frame), total forced style and layout time, and the number and total duration of attributed scripts. Rows group scripts by source URL, function name, character position and invoker, with count, total and maximum duration and forced style and layout time. Scripts without a source URL, such as code evaluated by the test harness through the DevTools protocol, share one `unattributed (includes harness-evaluated code)` row.

Chromium reports only frames longer than 50 ms and attributes only scripts longer than 5 ms, so zero frames does not mean that rendering was smooth. Long frames can also have no script entries at all: with VS Code 1.147.0, the long frames while opening the Settings editor had none, so `rows` was empty while the frame metrics were still reported. At most 2,000 frames and 1,000 rows are kept; extra frames and rows are counted in `overflowFrameCount` and `overflowRowCount`, and the result is marked incomplete. Sessions without `long-animation-frame` support, such as Node processes, return `available: false`. Unlike [long renderer tasks](./long-renderer-tasks), this measure does not use tracing.

JSON results retain numeric metrics and ranked rows. These measures start when the scenario measurement starts, not at process launch.
