# Tree View Refresh Lifecycle Churn

Keep one extension tree view open with 12,000 rows while repeatedly refreshing its provider. Each full refresh returns fresh row objects, exercising per-node lifecycle cleanup while the view stays registered.

The scenario is opt-in and uses its own fixture with setup, run, and teardown commands. Setup reveals a real row so the tree is visible and populated; run performs 20 complete refresh requests; teardown disposes the view and provider. Repeated e2e runs keep the same view alive until teardown.

```sh
xvfb-run -a node packages/cli/bin/test.js \
  --only tree-view-refresh-lifecycle-churn --runs 7 \
  --enable-extensions --run-skipped-tests-anyway \
  --measure named-function-count3 --check-leaks --measure-after --inspect-extensions \
  --vscode-path /absolute/path/to/vscode/code
```

The workload is intended for matched extension-host measurements. Inspect the test summary and fresh result JSON; a completed run does not by itself attribute generic heap growth to this scenario.
