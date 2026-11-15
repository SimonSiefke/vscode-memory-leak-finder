# Chat edit hunk toolbar lifecycle

A local mock chat participant streams 24 separated text edits through VS Code's
real chat editing service. No sign-in, Copilot extension, model request, API key,
or captured network recording is needed. Run with the replay proxy to block
unmatched external requests.

The lifecycle scenario repeats four hunk reveals and fade-complete hides three
times per iteration. It checks toolbar and menu disposal while the editing
session is still alive, including the menu's subscription store and remaining
menu change listeners. It requires repeated reuse of the same pooled widget
identities. It then clicks the real Keep and Undo actions and verifies the
resulting document. Resolving the remaining edits must release all menus before
chat disposal can mask a leak.

The focused `chat-edit-hunk-toolbar-pending-action` scenario uses the same local
provider. It gates the real Keep action inside its action runner, moves the
cursor outside the hunk, and waits until the fade scheduler has finished. The
hidden toolbar and menu must remain alive while that action is pending. Releasing
the gate must deliver one successful completion, apply Keep, and allow the menu
to be disposed. Undo and document verification establish that subsequent actions
still work. This is a renderer action-runner gate, not a mock replacement for the
Keep implementation.

Both scenarios use a temporary renderer prototype probe with weak references to
toolbars, menus and widgets. The probe observes real menu ownership rather than
inferring listener release from DOM removal. It restores the prototype and
releases a pending gate during teardown. Each iteration verifies disposal before
clearing its weak-reference records, deletes its chat and closes the editor;
teardown deletes the file and disposes the participant and local model.

```sh
xvfb-run -a node packages/cli/bin/test.js \
  --only chat-edit-hunk-toolbar- --runs 7 \
  --enable-extensions --use-proxy-mock --run-skipped-tests-anyway \
  --vscode-path /absolute/path/to/vscode/scripts/code.sh
```

Use an **unbundled development build** with lazy chat edit hunk toolbars and the
`chatParticipantAdditions` and `defaultChatParticipant` proposed APIs. The probe
imports the already loaded toolbar module and reads private ownership fields;
packaged bundles and builds with different private fields are unsupported. It
fails explicitly if the supported fields or exercised paths are absent. These
scenarios remain opt-in because the UI, proposed APIs and private ownership
fields vary between versions. Inspect the suite result: the harness reports
opt-in scenario failures as `skipped-failed`, even when its exit code is zero.

Validated locally with an unbundled Code OSS 1.146.0 development build. Ownership
checks run in the renderer, while the fixture's extension host only produces
edits and verifies document contents. No heap measurement is needed to establish
that a menu's subscription store and listeners were disposed; this does not
claim to count all listeners throughout the workbench or prove heap collection.

Regression sensitivity was checked under the same runtime and launch settings by
temporarily replacing each observed menu's `dispose` with a no-op. The DOM checks
still reached one toolbar, but the ownership assertion failed with two live menu
stores, one belonging to a disposed toolbar. Restoring disposal passed both
scenarios for three iterations each. This is a controlled cleanup reversal, not
a claim that a published affected release was tested.
