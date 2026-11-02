# Markdown editing

Three scenarios exercise sustained typing in a 1,500-line Markdown document:

- `markdown-edit-untracked`: an untracked file with Git enabled.
- `markdown-edit-git-tracked`: a tracked, modified file with Git enabled.
- `markdown-edit-git-disabled`: the same tracked, modified file with Git disabled.

Setup creates a local repository and verifies the document's Git status. It
also checks the repository count in Source Control before opening the editor.
The tracked document already differs from its committed version, so it remains
modified throughout the test. No remote repository or network access is needed.

Each iteration types 78 characters using native keyboard events, checks that
the final marker appears, undoes until the editor reports a clean document,
and saves. The saved document must exactly match the original working copy.
The editor remains open across iterations; its contents do not grow with the
run count. The check waits for the expected contents to reach disk, since the
tab's dirty indicator can disappear before saving finishes. Teardown closes the
document and removes the scenario's workspace settings.

Run all three scenarios independently with:

```sh
node packages/cli/bin/test.js --only '^markdown-edit-' --runs 37 --restart-between
```

Add `--check-leaks --measure-after --measure named-function-count3 --timeout-between 1000`
to compare retained renderer functions after warmup and allow delayed editor work
to finish before the final snapshot. Without the settling interval, continuous
typing can leave callbacks queued on folding, quick-diff, and comment schedulers.
Other harness measurements can be
selected to compare CPU or process-tree memory across the same three workloads.

These are bounded editing scenarios, not an hours-long crash reproducer. They
use built-in editor and Git functionality without Markdown preview or marketplace
extensions. Saving occurs after undo to verify the full document; typing itself
occurs with auto-save disabled. Undo history and document contents are bounded by
undoing each insertion before the next iteration.
