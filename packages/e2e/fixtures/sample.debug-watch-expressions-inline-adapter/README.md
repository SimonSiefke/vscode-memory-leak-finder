# Debug Watch Expressions Inline Adapter

Add a watch expression in the Run and Debug Watch view, start an inline debug
adapter that stops twice, continue between the stops, stop the session and remove
all watch expressions.

The inline adapter (`watch-inline`) answers each `evaluate` request with
`stop-<n>` and records its context and frame id. Each stop has its own frame id.
The `Verify Session` command checks that both stops received a `watch`
evaluation for their own frame, that no evaluation arrived after `disconnect`,
that the adapter was disposed and that no debug session remains. Intended
measurement processes: renderer and extension host.

The scenario has its own fixture and setup/run/teardown. It awaits explicit
completion notifications, and per-iteration resources are not stored in extension
subscriptions. Watch expressions persist in workspace storage, so setup and
cleanup remove leftovers by command id. Use `--enable-extensions`; if selecting
multiple scenarios, use `--restart-between` so each fixture loads at startup.

```sh
xvfb-run -a node packages/cli/bin/test.js \
  --only '^debug-watch-expressions-inline-adapter.ts' --runs 5 \
  --enable-extensions --run-skipped-tests-anyway \
  --check-leaks --measure-after --measure named-function-count3 --inspect-extensions
```

This is an opt-in measurement workload. Inspect the test summary and fresh result
JSON, not just the exit status.
