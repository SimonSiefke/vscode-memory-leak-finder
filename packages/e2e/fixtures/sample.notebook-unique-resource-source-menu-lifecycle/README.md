# Notebook Unique Resource Source Menu Lifecycle

Open and close a new notebook URI each cycle with a contributed kernel-source menu.

Source investigation: [#272](https://github.com/SimonSiefke/vscode/pull/272), [#273](https://github.com/SimonSiefke/vscode/pull/273), [#274](https://github.com/SimonSiefke/vscode/pull/274). Intended measurement process: renderer.

Verify each notebook editor is closed while its contributed kernel-source menu participates in the notebook lifecycle; new untitled notebook resources are allocated each cycle. This covers three independent owners with one identical workload.

The scenario has its own fixture and setup/run/teardown. It awaits explicit
completion notifications, and per-iteration resources are not stored in extension
subscriptions. The scenario fixture launcher loads this extension before debugger
attachment. Use `--enable-extensions` and a separate driver worktree; if selecting
multiple scenarios, use `--restart-between` so each fixture loads at startup.

```sh
xvfb-run -a node packages/cli/bin/test.js \
  --only notebook-unique-resource-source-menu-lifecycle --runs 7 \
  --enable-extensions --run-skipped-tests-anyway \
  --measure named-function-count3 --check-leaks --measure-after \
  --vscode-path /absolute/path/to/vscode/code
```

This is an opt-in measurement workload. Inspect the test summary and fresh result
JSON, not just the exit status. A completed workload may report growth on the
selected build. Attribution requires matched baseline/fixed builds and the
appropriate owner/measure; it does not follow from generic heap growth alone.
