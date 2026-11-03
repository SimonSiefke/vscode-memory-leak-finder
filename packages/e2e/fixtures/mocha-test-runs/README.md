# Mocha bulk test runs

Three opt-in e2e scenarios exercise the real `coderline.mocha-vscode` extension
with Mocha 11.7.5 and 5,000 fast tests:

- `mocha-run-many-tests`: 5,000 passing tests.
- `mocha-run-many-tests-mixed-results`: 4,990 passing, five failing, and five
  skipped tests, with progress output and durations reported by the adapter.
- `mocha-run-many-tests-repeated`: passing, mixed, then passing runs using the
  same discovered tree, extension host, and result history. Results are cleared
  only after the scenario finishes.

The suite writes a token and exact result counts from its final root `after`
hook. The driver waits for that fresh report independently of renderer activity,
then checks that the Testing summary stops spinning, has the expected counts,
and displays the same token in Test Results output within 30 seconds of the
hook. Wall time is checked after renderer calls return too, so a blocked renderer
cannot conceal a missed deadline. The repeated scenario alternates counts so a
previous run's completed summary cannot satisfy the next run.

This is a coarse regression guard for a long UI backlog after fast tests finish,
not a benchmark of Mocha execution time. The marker precedes adapter completion;
it does not claim that the extension's run handler has returned. The fixture uses
one suite containing 5,000 test cases and emits progress output every 100 cases.

Use a dedicated driver worktree and the repository's `.nvmrc` Node version.
Install dependencies and Mocha for VS Code 1.4.0 before launching the harness:

```sh
npm ci --ignore-scripts
npm run postinstall
npm ci --ignore-scripts --prefix packages/e2e/fixtures/mocha-test-runs
mkdir -p .vscode-extensions
cp -R packages/e2e/fixtures/mocha-test-runs .vscode-extensions/mocha-test-runs-fixture
env -u VSCODE_IPC_HOOK_CLI /absolute/path/to/vscode/bin/code \
  --user-data-dir "$PWD/.vscode-user-data-dir" \
  --extensions-dir "$PWD/.vscode-extensions" \
  --install-extension coderline.mocha-vscode@1.4.0

xvfb-run -a node packages/cli/bin/test.js \
  --cwd packages/e2e --only mocha-run-many-tests \
  --runs 1 --enable-extensions --run-skipped-tests-anyway \
  --vscode-path /absolute/path/to/vscode/code
```

The CLI example uses Linux paths and Xvfb. On macOS or Windows use the
corresponding Code CLI/executable and omit Xvfb. Keep other test-provider
extensions out of the driver profile because Run All Tests targets all
controllers. Do not pass `--clear-extensions`, which removes the prepared
extension. No extension installation or extension-host restart happens inside
the measured scenario. The companion fixture contributes a discovery command
that activates the real Mocha extension after workspace creation. It does not
provide its own test controller or synthesize test results.

To run just one scenario, include its filename, for example
`--only mocha-run-many-tests-repeated.ts`. For renderer memory measurements,
add `--measure named-function-count3 --check-leaks --measure-after --runs 7`.
Run measurements sequentially and inspect the summary: an opt-in scenario can
report `SKIP (FAIL)` even when the CLI exits with zero. Results, output views,
and per-run marker files are cleared in teardown; the workspace and dependencies
are disposable harness state.
