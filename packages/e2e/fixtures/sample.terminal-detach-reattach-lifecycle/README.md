# Terminal Detach Reattach Lifecycle

Detach and reattach the same persistent terminal across iterations.

Source investigation: [#252](https://github.com/SimonSiefke/vscode/pull/252), [#258](https://github.com/SimonSiefke/vscode/pull/258). Intended measurement process: pty-host.

Verify identity and output survive; snapshot the persistent PTY host; inspect both serialization add-ons and performance marks.

The scenario has its own fixture and setup/run/teardown. It awaits explicit
completion notifications, and per-iteration resources are not stored in extension
subscriptions. The scenario fixture launcher loads this extension before debugger
attachment. Use `--enable-extensions` and a separate driver worktree; if selecting
multiple scenarios, use `--restart-between` so each fixture loads at startup.

```sh
xvfb-run -a node packages/cli/bin/test.js \
  --only terminal-detach-reattach-lifecycle --runs 7 \
  --enable-extensions --run-skipped-tests-anyway \
  --measure named-function-count3 --check-leaks --measure-after --inspect-ptyhost \
  --vscode-path /absolute/path/to/vscode/code
```

This is an opt-in measurement workload. Inspect the test summary and fresh result
JSON, not just the exit status. A completed workload may report growth on the
selected build. Attribution requires matched baseline/fixed builds and the
appropriate owner/measure; it does not follow from generic heap growth alone.
