# Edit telemetry document snapshots

`edit-telemetry-document-snapshots` exercises normal edit telemetry in a
3,000-line document, using native typing and undo/redo. It warms up in setup,
then checks collection after every iteration while keeping the document open.
No model provider, account, extension fixture, or remote service is needed.

This scenario is opt-in because its renderer probe requires an **unbundled
VS Code development build** with `DocumentWithSourceAnnotatedEdits`,
`CombineStreamedChanges`, and observable debug ownership metadata. Packaged
builds do not expose these modules. Unsupported builds fail explicitly when
selected; the default suite skips this development-only probe.

```sh
node packages/cli/bin/test.js --only edit-telemetry-document-snapshots \
  --vscode-path /path/to/vscode/scripts/code.sh \
  --runs 5 --run-skipped-tests-anyway > edit-telemetry-results.log 2>&1
cat edit-telemetry-results.log
rg -q '^Test Suites: 1 passed, 1 total' edit-telemetry-results.log
```

The existing harness reports failed opt-in scenarios as `skipped-failed` without
a failing exit code. The final summary check above is required for an automated
pass/fail verdict; an empty run or unsupported path must not count as a pass.

The probe restores the original user settings after the scenario. It enables
usage telemetry and edit statistics in the isolated harness profile, checking
that the real edit-tracking command was registered. OSS development builds
use local telemetry logging.

The renderer probe observes the existing observable setter without creating a
second edit pipeline or replacing its async iterator. It tracks only the fixture
document. Every typing/undo/redo phase must produce another observed edit, and
publication must catch up to the input count and latest snapshot. A disabled or
unconsumed path cannot silently pass.

The measured objects are old renderer `StringText` snapshots. The probe stores
only weak references, never old document contents or inspector object handles.
It forces renderer garbage collection through the harness's existing CDP
connection, then rejects surviving old snapshots. The two newest snapshots are
excluded because the suspended consumer may still hold its last loop value.
Undo history can legitimately hold strings; it does not own these `StringText`
wrappers. Successful checks prune the weak-reference records to the latest two.
This is an object-lifetime assertion, not a zero-growth assertion on
the document's undo history or the entire heap.

Do **not** use `waitForQueue()` for readiness here: it restarts the iterator,
releasing a replay buffer and concealing the regression. The document is closed
only after collection has been checked. Setup and iteration failures restore
the probe and settings before cleaning up the fixture.

## Validation

Validated on Linux with an unbundled Code OSS 1.146.0 development build,
Electron 43.8.6, and the harness's pinned Node 24.22.2. Earlier or bundled builds
have not been validated. An initial matched trial used two measured iterations
plus warmup: the fixed iterator passed; restoring the original replaying iterator
in generated JavaScript retained all 17 measured old snapshots and failed during
warmup. The final fixed-build trial also passed five measured iterations plus
warmup. No document close or iterator drain occurred before either verdict.

For Linux worktrees with long paths, supply a short, private `XDG_RUNTIME_DIR`;
VS Code's IPC socket cannot exceed the operating system's socket-path limit.
Set `VSCODE_SKIP_PRELAUNCH=1` only after preparing the development build and its
runtime. These are local launch requirements, not changes to product behavior.
