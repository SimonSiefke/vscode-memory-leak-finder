# Integrated Browser Cross Site Frame Disposal

Keep an integrated-browser tab alive while adding and removing a cross-site iframe.

Source investigation: [#255](https://github.com/SimonSiefke/vscode/pull/255). Intended measurement process: main.

Prove the iframe has its own CDP target/session and that target detach completed; a same-origin iframe would miss the original DebugSession retention.

The scenario has its own fixture and setup/run/teardown. It awaits explicit
completion notifications, and per-iteration resources are not stored in extension
subscriptions. The scenario fixture launcher loads this extension before debugger
attachment. Use `--enable-extensions` and a separate driver worktree; if selecting
multiple scenarios, use `--restart-between` so each fixture loads at startup.

```sh
xvfb-run -a node packages/cli/bin/test.js \
  --only integrated-browser-cross-site-frame-disposal --runs 7 \
  --enable-extensions --run-skipped-tests-anyway \
  --measure named-function-count3 --check-leaks --measure-after --measure-node \
  --vscode-path /absolute/path/to/vscode/code
```

This is an opt-in measurement workload. Inspect the test summary and fresh result
JSON, not just the exit status. A completed workload may report growth on the
selected build. Attribution requires matched baseline/fixed builds and the
appropriate owner/measure; it does not follow from generic heap growth alone.
