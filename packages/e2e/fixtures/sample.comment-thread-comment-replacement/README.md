# Comment Thread Comment Replacement

Keep a controller and thread alive while replacing the thread comments each iteration.

Source investigation: [#243](https://github.com/SimonSiefke/vscode/pull/243). Intended measurement process: extension-host.

Wait for the debounced update to be delivered; disposing the thread each time masks the comment-ID-map leak.

The scenario has its own fixture and setup/run/teardown. It awaits explicit
completion notifications, and per-iteration resources are not stored in extension
subscriptions. The scenario fixture launcher loads this extension before debugger
attachment. Use `--enable-extensions` and a separate driver worktree; if selecting
multiple scenarios, use `--restart-between` so each fixture loads at startup.

```sh
xvfb-run -a node packages/cli/bin/test.js \
  --only comment-thread-comment-replacement --runs 7 \
  --enable-extensions --run-skipped-tests-anyway \
  --measure named-function-count3 --check-leaks --measure-after --inspect-extensions \
  --vscode-path /absolute/path/to/vscode/code
```

This is an opt-in measurement workload. Inspect the test summary and fresh result
JSON, not just the exit status. A completed workload may report growth on the
selected build. Attribution requires matched baseline/fixed builds and the
appropriate owner/measure; it does not follow from generic heap growth alone.
