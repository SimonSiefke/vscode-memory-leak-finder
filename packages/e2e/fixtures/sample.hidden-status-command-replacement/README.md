# Hidden Status Command lifecycle

Reproduces the public API lifecycle investigated in [VS Code fork PR #269](https://github.com/SimonSiefke/vscode/pull/269).

Replace command arguments on a persistent hidden status-bar item. Keep the item hidden and alive across iterations; showing or disposing it each time would mask stale command registrations. Teardown disposes the item.

One test run is one lifecycle iteration. Per-iteration resources are not added to
`context.subscriptions`, which would itself retain them. The test waits for a
completion notification after the command callback finishes, then dismisses it.
Setup and teardown invoke this fixture's cleanup command.

Install this opt-in test’s dedicated fixture before launching VS Code, as shown
below. Installing during setup would restart the extension host after the debugger
connects and invalidate extension-host measurements. Do not pass `--clear-extensions`,
which would remove the prepared fixture. Use a fresh driver worktree and install before its first VS Code launch: an
existing profile can cache its extension inventory and ignore manually copied
fixtures. Keep other fixtures out of that worktree during measurement.

From the repository root, using the `.nvmrc` Node version:

```sh
mkdir -p .vscode-extensions
cp -R packages/e2e/fixtures/sample.hidden-status-command-replacement .vscode-extensions/
xvfb-run -a node packages/cli/bin/test.js \
  --only hidden-status-command-replacement \
  --runs 7 --enable-extensions --run-skipped-tests-anyway \
  --measure named-function-count3 --check-leaks --measure-after --inspect-extensions \
  --vscode-path /absolute/path/to/vscode/code
```

Run measurements sequentially. This is a measurement workload, not an assertion
that a particular VS Code release is leak-free. Inspect the summary and fresh
result JSON: growth can be reported after a successful lifecycle, while a failed
opt-in test can exit with code zero. Compare matched baseline and fixed builds
to attribute growth changes.
