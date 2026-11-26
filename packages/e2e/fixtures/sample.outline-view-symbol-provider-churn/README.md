# Outline View Symbol Provider Churn

Register a document symbol provider for `*.outline-fixture` files, drive the
Outline view through two documents, then dispose the provider while a document
is still open.

Each run registers the provider, opens `alpha.outline-fixture` (three symbols),
selects `alphaTwo` and then `alphaThree` in the Outline view and checks that
the cursor moves to lines 2 and 3, opens `beta.outline-fixture` (two symbols), and disposes the provider.
The Outline view must then report that the open document has no symbols, and
after closing all editors it must show its empty message. Disposal fails if a
symbol request is still in flight or if the provider was never queried.

The scenario disables `workbench.editor.restoreViewState` in its workspace so a
reopened editor starts on line 1 every cycle. The Outline view keeps each
document's tree selection, which is why every click moves the selection to a
different symbol.

Breadcrumbs and sticky scroll also query the provider, so request counts are
reported but not asserted exactly.

The scenario fixture launcher loads this extension before debugger attachment.
Use `--enable-extensions`; if selecting multiple scenarios, use
`--restart-between` so each fixture loads at startup.

```sh
xvfb-run -a node packages/cli/bin/test.js \
  --only '^outline-view-symbol-provider-churn.ts' --runs 5 \
  --enable-extensions --run-skipped-tests-anyway \
  --check-leaks --measure-after
```

This is an opt-in workload. Inspect the test summary and fresh result JSON, not
just the exit status.
