# Task Provider Rejection

Fetch tasks from a provider that rejects, matching the saved public-API reproduction.

Source investigation: [#253](https://github.com/SimonSiefke/vscode/pull/253). Intended measurement process: renderer.

Assert exactly one provider invocation per fetch. The original E2E reproduced provider rejection in the renderer; custom-ID rejection was covered by the focused product unit test.

The scenario has its own fixture and setup/run/teardown. It awaits explicit
completion notifications, and per-iteration resources are not stored in extension
subscriptions. The scenario fixture launcher loads this extension before debugger
attachment. Use `--enable-extensions` and a separate driver worktree; if selecting
multiple scenarios, use `--restart-between` so each fixture loads at startup.

```sh
xvfb-run -a node packages/cli/bin/test.js \
  --only task-provider-rejection --runs 7 \
  --enable-extensions --run-skipped-tests-anyway \
  --measure named-function-count3 --check-leaks --measure-after \
  --vscode-path /absolute/path/to/vscode/code
```

This is an opt-in measurement workload. Inspect the test summary and fresh result
JSON, not just the exit status. A completed workload may report growth on the
selected build. Attribution requires matched baseline/fixed builds and the
appropriate owner/measure; it does not follow from generic heap growth alone.
