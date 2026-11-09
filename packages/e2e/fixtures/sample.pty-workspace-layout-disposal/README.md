# Pty Workspace Layout Disposal

Open a distinct workspace window, create and remove its terminal, then close the window gracefully.

Source investigation: [#232](https://github.com/SimonSiefke/vscode/pull/232). Intended measurement process: pty-host.

Assert no tabs or background terminals remain and inspect the surviving PTY host; ordinary empty windows miss layout creation.

The scenario has its own fixture and setup/run/teardown. It awaits explicit
completion notifications, and per-iteration resources are not stored in extension
subscriptions. The scenario fixture launcher loads this extension before debugger
attachment. Use `--enable-extensions` and a separate driver worktree; if selecting
multiple scenarios, use `--restart-between` so each fixture loads at startup.

```sh
xvfb-run -a node packages/cli/bin/test.js \
  --only pty-workspace-layout-disposal --runs 7 \
  --enable-extensions --run-skipped-tests-anyway \
  --measure named-function-count3 --check-leaks --measure-after --inspect-ptyhost \
  --vscode-path /absolute/path/to/vscode/code
```

This is an opt-in measurement workload. Inspect the test summary and fresh result
JSON, not just the exit status. A completed workload may report growth on the
selected build. Attribution requires matched baseline/fixed builds and the
appropriate owner/measure; it does not follow from generic heap growth alone.
