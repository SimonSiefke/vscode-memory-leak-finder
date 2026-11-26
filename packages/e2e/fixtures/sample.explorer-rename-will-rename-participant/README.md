# Explorer Rename Participant

Rename a file in the Explorer while a `workspace.onWillRenameFiles` participant
supplies a `WorkspaceEdit` for a second file, then rename it again while the
participant blocks past `files.participants.timeout` and resolves late.

Assert the confirmed edit is applied exactly once, that the cancelled rename
still completes without the participant's edit, that the late result is dropped
without an error, and that the disposed listener no longer receives rename
events.

The scenario has its own fixture and setup/run/teardown. It awaits explicit
completion notifications and answers the native refactoring confirmation by
button label. Use `--enable-extensions`; if selecting multiple scenarios, use
`--restart-between` so the fixture loads at startup.

```sh
xvfb-run -a node packages/cli/bin/test.js \
  --only '^explorer-rename-will-rename-participant.ts' --runs 5 \
  --enable-extensions --run-skipped-tests-anyway \
  --check-leaks --measure-after --measure pending-promises-with-retainers --inspect-extensions
```

This is an opt-in workload. Inspect the test summary and fresh result JSON, not
just the exit status.
