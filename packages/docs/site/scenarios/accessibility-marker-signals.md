# Accessibility marker signals

These scenarios follow the marker-observer and cursor-restoration path in
`EditorTextPropertySignalsContribution`. A local fixture publishes an error on
line 2 and a warning on line 4 in two plain text files. Error and warning
announcements are enabled in screen reader optimized mode; sound is off.
Assertions check the live accessibility status text without requiring a physical
screen reader. The fixture navigates with the editor-opening API after the command palette
has closed, avoiding interference with cursor positions and announcements.

- `accessibility-marker-editor-restore` switches between two pinned tabs five
  times, checks their saved cursor positions, then closes and reopens the files.
  It checks error and warning announcements after navigating to both markers.
  Reopened editors are given explicit selections; saved positions are checked
  during tab switching.
- `accessibility-marker-update` clears the diagnostics, waits for their editor
  decorations to disappear, then republishes them while the cursor stays at the
  error. An error announcement and decoration must appear without cursor motion.

The fixture records command completion in a workspace file, including failures,
using an atomic rename. The driver acknowledges that the command palette has
closed before the fixture starts. During diagnostic replacement, a second
acknowledgement confirms the empty decorations and cursor position before the
fixture publishes markers without moving the cursor. The diagnostic collection and commands
are registered with the extension context. Teardown clears diagnostics, closes
editors, and removes the workspace settings through the configuration API.
Using that API also makes setup reliable when the test workspace is excluded
from filesystem watching. Each iteration clears the bounded editor navigation
history and restores the primary cursor, so history selections do not accumulate
in the memory comparison. This does not disable the marker signal contribution.

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
