# Notebook Linkifier Repeat And Close

Request notebook-linked chat output through the real Copilot chat participant using a deterministic local language-model provider, then close the notebook. The tested VS Code build must include the GitHub.copilot-chat extension. Setup enables extensions in the isolated test profile before activating Copilot. The asserted response comes from the local model provider without a replay recording; Copilot background services can still make network requests.

Source investigation: [#115](https://github.com/SimonSiefke/vscode/pull/115). Intended measurement process: extension-host.

Verify that both generated cell references become notebook-cell URI links, then observe event-listener/map retention; generic notebook open/close does not invoke it.

The scenario has its own fixture and setup/run/teardown. It awaits explicit
completion notifications, and per-iteration resources are not stored in extension
subscriptions. The scenario fixture launcher loads this extension before debugger
attachment. Use `--enable-extensions` and a separate driver worktree; if selecting
multiple scenarios, use `--restart-between` so each fixture loads at startup.

```sh
xvfb-run -a node packages/cli/bin/test.js \
  --only notebook-linkifier-repeat-and-close --runs 7 \
  --enable-extensions --run-skipped-tests-anyway \
  --measure named-function-count3 --check-leaks --measure-after --inspect-extensions \
  --vscode-path /absolute/path/to/vscode/code
```

This is an opt-in measurement workload. Inspect the test summary and fresh result
JSON, not just the exit status. A completed workload may report growth on the
selected build. Attribution requires matched baseline/fixed builds and the
appropriate owner/measure; it does not follow from generic heap growth alone.
