# Late task provider disposal

Hold `provideTasks` behind a promise, wait until VS Code calls it, dispose its
registration, and only then return a custom execution. Assert that discovery
finishes without publishing the disposed owner's task. A second provider of the
same task type must still supply an executable callback; run its PTY and await
its task-end event, checking exactly one callback and `open` call.

The discarded closure is named `lateDisposedProviderCallback` and captures a
`LateDisposedProviderState`. Neither is stored in subscriptions or fixture globals.
Only the iteration number and original workspace setting survive a run. All
listeners, registrations, emitters and pending discovery are released in `finally`.
The extension host stays alive across warm-up and measured repetitions.

This is opt-in because it needs extensions and extension-host inspection. The
ordinary renderer/event-listener CI run cannot measure the owning maps. Select
one scenario per launch so its extension loads before debugger attachment:

```sh
env -u NODE_DISABLE_COMPILE_CACHE xvfb-run -a node packages/cli/bin/test.js \
  --only task-custom-execution-late-provider-disposal --runs 7 \
  --enable-extensions --run-skipped-tests-anyway \
  --measure named-function-count3 --check-leaks --measure-after --inspect-extensions
```

Use the repository's pinned Node version. Serialize this command with other
heavy VS Code measurements when sharing a machine. Inspect the fresh result JSON
for `lateDisposedProviderCallback` growth; unrelated function growth alone does
not establish a leak in the disposed owner's callback.

This covers pending discovery and a live-provider control. It does not claim
coverage of late `resolveTask`, accepted-startup races, concurrent starts sharing
a definition, or a PTY returned after cancellation. The notification is emitted
only after every lifecycle assertion succeeds; a timeout fails the scenario.

Runtime validation remains incomplete. On Linux with the pinned Node version and
the default packaged VS Code 1.145.0, both this scenario and the existing provider
disposal scenario stopped during initialization with `Failed to attach to page`.
No setup notification or heap result was reached. Sensitivity against an affected
build and matched fixed-build measurements remain required before enabling this
scenario or treating it as validated regression coverage. The manifest's engine
range is API compatibility metadata, not a tested-version claim.
