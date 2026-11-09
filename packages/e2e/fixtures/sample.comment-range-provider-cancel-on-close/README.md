# Comment Range Provider Cancel On Close

Open an editor with a pending comment-range provider request, then close it while the request is delayed.

Source investigation: [#48](https://github.com/SimonSiefke/vscode/pull/48), [#34](https://github.com/SimonSiefke/vscode/pull/34). Intended measurement process: renderer.

Handshake on provider entry and close before completion; investigate canceled scheduler versus permanent retention separately.

The scenario has its own fixture and setup/run/teardown. It awaits explicit
completion notifications, and per-iteration resources are not stored in extension
subscriptions. The scenario fixture launcher loads this extension before debugger
attachment. Use `--enable-extensions` and a separate driver worktree; if selecting
multiple scenarios, use `--restart-between` so each fixture loads at startup.

```sh
xvfb-run -a node packages/cli/bin/test.js \
  --only comment-range-provider-cancel-on-close --runs 7 \
  --enable-extensions --run-skipped-tests-anyway \
  --measure named-function-count3 --check-leaks --measure-after \
  --vscode-path /absolute/path/to/vscode/code
```

This is an opt-in measurement workload. Inspect the test summary and fresh result
JSON, not just the exit status. A completed workload may report growth on the
selected build. Attribution requires matched baseline/fixed builds and the
appropriate owner/measure; it does not follow from generic heap growth alone.
