# Accessibility marker signals

These scenarios follow the marker-observer and cursor-restoration path in
`EditorTextPropertySignalsContribution`. A local fixture publishes an error on
line 2 and a warning on line 4 in two plain text files. Error and warning
announcements are explicitly enabled; sound is off. Assertions check the live
accessibility status text, so they work without an attached screen reader.

- `accessibility-marker-editor-restore` switches between two pinned tabs five
  times, checks their saved cursor positions, then closes and reopens the files.
  It checks error and warning announcements after navigating to both markers.
- `accessibility-marker-update` clears the diagnostics, waits for their editor
  decorations to disappear, then republishes them while the cursor stays at the
  error. An error announcement and decoration must appear without cursor motion.

The fixture records command completion in a workspace file, including failures.
The driver waits for that result instead of assuming selecting an extension
command means its callback has finished. The diagnostic collection and commands
are registered with the extension context. Teardown clears diagnostics, closes
editors, and removes the workspace settings.

The scenarios are opt-in because they require the fixture extension. Run either
with `--enable-extensions --run-skipped-tests-anyway`; for example:

```sh
node packages/cli/bin/test.js --only accessibility-marker-editor-restore --enable-extensions --run-skipped-tests-anyway --runs 2 --vscode-path /path/to/vscode/scripts/code.sh
```

For renderer memory measurements, use 37 measured iterations with
`--measure named-function-count3 --check-leaks --measure-after --timeout-between 1000`.
Keep the same executable, extension enablement, and settling interval when
comparing revisions. The default measure filters common event/observable helper
functions; inspect surviving callbacks and retaining paths before attributing
any growth to marker-service listeners. An empty result alone does not establish
an exact listener count or reproduce the historical telemetry environment.
