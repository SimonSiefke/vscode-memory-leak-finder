# Quick Pick Late Items

Open an extension quick pick with `createQuickPick`, type a value that starts a
deferred load, press Escape while the load is pending, then release the load so
the extension assigns late items to the hidden quick pick.

The extension never calls `hide()`, so after the user presses Escape the
extension host still considers the quick pick visible and sends the late
`items`/`busy` update to the renderer. The update carries no `visible` property,
so the widget must stay hidden and the late item must not appear.

Commands:

- `Quick Pick Late Items: Open` creates and shows the quick pick with one initial item.
  Typing a value shows `Loading results…` and starts a pending load.
- `Quick Pick Late Items: Release` resolves the load, waits for the batched update
  and a `setContext` round trip, then reports the value and the number of hide events.
  It reports an error if the quick pick was not hidden before the release or if the
  late update changed the hide count.
- `Quick Pick Late Items: Cleanup` disposes the quick pick and its listeners and
  reports the number of live quick picks.

Disposing after the user pressed Escape fires `onDidHide` a second time, so the
fixture does not assert a single hide event after cleanup.

The scenario has its own fixture. The scenario fixture launcher loads this
extension before debugger attachment. Use `--enable-extensions`; if selecting
multiple scenarios, use `--restart-between` so each fixture loads at startup.

```sh
xvfb-run -a node packages/cli/bin/test.js \
  --only '^quick-pick-extension-api-late-items.ts' --runs 5 \
  --enable-extensions --run-skipped-tests-anyway \
  --check-leaks --measure-after
```

This is an opt-in workload. Inspect the test summary, not just the exit status.
