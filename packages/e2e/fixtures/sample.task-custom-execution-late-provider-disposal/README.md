# Late task provider disposal

Hold `provideTasks` behind a promise, wait until VS Code calls it, dispose its
registration, and only then return a custom execution. Assert that discovery
finishes without publishing the disposed owner's task. A second provider of the
same task type must still supply an executable callback; run its PTY and await
its task-end event, checking exactly one callback and `open` call.

Then discover a separate custom task and hold its callback pending. Wait for the
callback to enter, dispose its provider, terminate the accepted task, and wait for
its task-end event before returning a PTY. Assert that the late PTY is closed
exactly once without being opened. The callback is named
`lateCanceledProviderCallback` and captures `LateCanceledProviderState` for heap
attribution.

The discarded closure is named `lateDisposedProviderCallback` and captures a
`LateDisposedProviderState`. Neither is stored in subscriptions or fixture globals.
Only the iteration number and original workspace setting survive a run. All
listeners, registrations, emitters and pending discovery are released in `finally`.
The extension host stays alive across warm-up and measured repetitions.

This is opt-in because it needs extensions and extension-host inspection. The
ordinary renderer/event-listener CI run cannot measure the owning maps. Select
one scenario per launch so its extension loads before debugger attachment:

```sh
# On Linux, create a short private runtime directory to keep IPC socket paths
# below the platform limit when the harness worktree has a long absolute path.
runtime_dir=$(mktemp -d /tmp/task-disposal.XXXXXX) || exit
trap 'rm -rf "$runtime_dir"' EXIT
env -u NODE_DISABLE_COMPILE_CACHE XDG_RUNTIME_DIR="$runtime_dir" xvfb-run -a node packages/cli/bin/test.js \
  --only task-custom-execution-late-provider-disposal --runs 37 \
  --enable-extensions --run-skipped-tests-anyway \
  --measure named-function-count3 --check-leaks --measure-after --inspect-extensions
```

Use the repository's pinned Node version. Serialize this command with other
heavy VS Code measurements when sharing a machine. Inspect the fresh result JSON
for `lateDisposedProviderCallback` growth; unrelated function growth alone does
not establish a leak in the disposed owner's callback.

This covers pending discovery, a live-provider control, accepted task cancellation
while its callback is pending, and a PTY returned after cancellation. It does not
claim coverage of late `resolveTask` or concurrent starts sharing a definition.
The completion notification is emitted only after every assertion succeeds;
a timeout fails the scenario.

Validated on Linux with Node v24.22.2 and packaged VS Code 1.145.0. Both the
original provider-disposal workload and this workload pass with two warm-up
actions followed by 37 measured actions in one extension host. The
`named-function-count3` results contain no growth rows.

Sensitivity was checked using separate copies of the same packaged executable,
with one cleanup path removed in each copy. Removing disposed-owner callback
cleanup makes the original workload retain 37 additional
`disposedProviderCallback` closures, `CustomExecutionState` instances and
`CustomExecution` objects. Removing the late-PTY cancellation cleanup makes this
workload fail during warm-up because the returned PTY is never closed. This is a
controlled local reversal, not a claim about a particular released affected
version. Other platforms and older versions have not been validated.

Both workloads remain opt-in because ordinary renderer CI does not enable their
fixture extensions or inspect the extension-host heap. For these explicit runs,
`SKIP (PASS)` means the selected opt-in workload executed successfully;
`SKIP (FAIL)` must be rejected even if the CLI exits zero. The manifest's engine
range is API compatibility metadata, not a tested-version claim.
