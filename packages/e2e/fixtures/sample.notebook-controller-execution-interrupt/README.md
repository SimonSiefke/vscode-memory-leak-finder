# Notebook Controller Execution Interrupt

An offline notebook controller whose cell execution can be interrupted from the UI.

The fixture registers a serializer for `vmlf-interrupt-notebook` and a single
`Interrupt Fixture Kernel` controller without an `interruptHandler`, so the
Stop Cell Execution button cancels the execution token. The first execution in
each cycle writes `stream: first chunk` and then blocks until its token is
cancelled, ends with `success: false` and reports `interrupt observed`. The
next execution replaces the output with `completed` and succeeds.

- **Setup** registers the serializer and controller and opens an untitled notebook.
- **Reset** checks that the cycle saw one interrupt and one completion, that no
  execution is pending and that the outputs were cleared, then starts a new cycle.
- **Cleanup** checks that no execution is pending, closes the notebook and
  disposes the controller and serializer.

Per-cycle resources are not stored in extension subscriptions. Use
`--enable-extensions` so the scenario launcher loads this extension before
debugger attachment.

```sh
xvfb-run -a node packages/cli/bin/test.js \
  --only '^notebook-controller-execution-interrupt.ts' --runs 5 \
  --enable-extensions --run-skipped-tests-anyway \
  --check-leaks --measure-after --measure pending-promises-with-retainers --inspect-extensions
```
