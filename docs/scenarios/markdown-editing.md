# Markdown editing

Eight scenarios exercise editing in a 1,500-line Markdown document:

- `markdown-edit-untracked`: an untracked file with Git enabled.
- `markdown-edit-git-tracked`: a tracked, modified file with Git enabled.
- `markdown-edit-git-disabled`: the same tracked, modified file with Git disabled.
- `markdown-typing-untracked`, `markdown-typing-git-tracked`, and
  `markdown-typing-git-disabled`: the same three Git configurations, retaining
  each insertion instead of undoing it.
- `markdown-undo-redo-git-tracked`: undo and redo an existing insertion repeatedly.
- `markdown-typing-delete-git-tracked`: type, save, delete, and save without undo.

Setup creates a local repository and verifies the document's Git status. It
also checks the repository count in Source Control before opening the editor.
Git-enabled scenarios wait for Git activation and explicitly open the fixture
repository, including after a preceding scenario disabled Git. An explicit Git
refresh synchronizes Source Control after the fixture's commits and file writes.
The tracked document already differs from its committed version, so it remains
modified throughout the test. No remote repository or network access is needed.

Each `markdown-edit-*` iteration types 78 characters using native keyboard events, checks that
the final marker appears, undoes until the editor reports a clean document,
and saves. The saved document must exactly match the original working copy.
The editor remains open across iterations; its contents do not grow with the
run count. The check waits for the expected contents to reach disk, since the
tab's dirty indicator can disappear before saving finishes. Teardown closes the
document and restores the workspace settings while the fixture repository still
exists. It then opens and closes the fixture's Git model before removing its
`.git` directory. This prevents later scenarios from
retaining the deleted repository or discovering the harness's parent repository.
Each iteration focuses the editor before dispatching native typing events.

The three typing variants for the different Git configurations append 78
characters, save, and check the entire document against the cumulative expected
contents. The editor stays
open and no undo history is cleared between iterations. Both the document and
its undo history can grow with the run count. Saving between insertions also
exercises history boundaries and the modified-file Git path.

The undo/redo scenario makes one insertion during setup. Each iteration undoes
one native typing group, checks that the saved document loses only a suffix of
that insertion, then redoes it and verifies the exact original contents on disk.
It adds no new text during the measured iterations. This distinguishes history
movement from accumulating new history.

The controls that save twice per iteration wait for the tab to become clean
after each save before checking disk contents or starting the next edit. Command
palette execution can return while the save operation is still running.

The type/delete scenario checks the inserted contents on disk before deleting
them with selection and Backspace. It then verifies the exact baseline again.
The save boundary preserves history for both operations. This keeps document
contents fixed while allowing undo history to grow; it does not clear that
history during the measured iterations.

For example, run the accumulating Git-tracked workload with:

```sh
node packages/cli/bin/test.js --only markdown-typing-git-tracked --runs 37 --run-skipped-tests-anyway
```

The four `markdown-typing-*` workloads are opt-in because they intentionally
accumulate undo history. Their endpoints retain more history than their starting
states; generic zero-growth checks cannot distinguish that state from a leak.
The other four scenarios keep their history bounded and run by default.

Add `--check-leaks --measure-after --measure named-function-count3 --timeout-between 1000`
to compare retained renderer functions after warmup and allow delayed editor work
to finish before the final snapshot. Without the settling interval, continuous
typing can leave callbacks queued on folding, quick-diff, and comment schedulers.
The function detector excludes allocations mapped to `editStack.ts` and
`undoRedoService.ts`, and it does not measure serialized edit bytes. Zero rows
therefore do not establish that undo/redo memory is stable. Inspect unfiltered
heap objects, the resource's past/future stack lengths, and their edit payloads
when investigating history growth. Undo data retained for an open document is
expected; closed-file restoration also deliberately retains history subject to
a separate memory budget. Check ownership and release before calling growth a
cleanup leak. Other harness measurements can compare CPU or process-tree memory.

Use `--inspect-extensions` to capture the extension host. The Markdown language
server runs in a separate child process and needs its own inspector capture.
For rapid undo/save/redo/save measurements, allow at least two seconds of
settling so the save participant's 1,750 ms timeout callbacks can finish.

These are short editing scenarios, not an hours-long crash reproducer. They
use built-in editor and Git functionality without Markdown preview or marketplace
extensions. All typing occurs with auto-save disabled. The `markdown-edit-*`
workloads bound history and contents by undoing each insertion and saving before
the next iteration. The undo/redo control reuses the same insertion; the typing
workloads retain new history.
