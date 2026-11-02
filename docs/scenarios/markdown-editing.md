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
The editor remains open across
iterations; its contents do not grow with the run count. Teardown closes the
document and removes the scenario's workspace settings.

Run all three scenarios independently with:

```sh
node packages/cli/bin/test.js --only '^markdown-edit-' --runs 37 --restart-between
```

Add `--check-leaks --measure-after --measure named-function-count3` to compare
retained renderer functions after warmup. Other harness measurements can be
selected to compare CPU or process-tree memory across the same three workloads.

These are bounded editing scenarios, not an hours-long crash reproducer. They
use built-in editor and Git functionality without Markdown preview or marketplace
extensions. Saving occurs after undo to verify the full document; typing itself
occurs with auto-save disabled. Undo history and document contents are bounded by
undoing each insertion before the next iteration.
