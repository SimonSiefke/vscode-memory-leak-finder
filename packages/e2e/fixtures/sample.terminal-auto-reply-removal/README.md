# Terminal Auto Reply Removal

Add a distinct auto reply, remove it, and create another terminal each iteration.

Source investigation: [#231](https://github.com/SimonSiefke/vscode/pull/231), [#284](https://github.com/SimonSiefke/vscode/pull/284). Intended measurement process: pty-host.

Assert the removed reply is not installed in later terminals; restore settings and close terminals; do not duplicate the earlier and replacement fix PRs.

The scenario has its own fixture and setup/run/teardown. It awaits explicit
completion notifications, and per-iteration resources are not stored in extension
subscriptions. The scenario fixture launcher loads this extension before debugger
attachment. Use `--enable-extensions` and a separate driver worktree; if selecting
multiple scenarios, use `--restart-between` so each fixture loads at startup.

```sh
xvfb-run -a node packages/cli/bin/test.js \
  --only terminal-auto-reply-removal --runs 7 \
  --enable-extensions --run-skipped-tests-anyway \
  --measure named-function-count3 --check-leaks --measure-after --inspect-ptyhost \
  --vscode-path /absolute/path/to/vscode/code
```

This is an opt-in measurement workload. Inspect the test summary and fresh result
JSON, not just the exit status. A completed workload may report growth on the
selected build. Attribution requires matched baseline/fixed builds and the
appropriate owner/measure; it does not follow from generic heap growth alone.

Baseline result on VS Code 1.139.0: after removing the configured auto reply, the
new terminal printed `REPLY_RESULT_1:obsolete-reply` instead of
`REPLY_RESULT_1:NO_REPLY`. The functional regression assertion intentionally
fails on that build, before heap measurement. Run against a fixed build to
complete the seven-cycle memory measurement. The test closes its per-cycle
terminal even when that assertion fails.
