# Webview View Visibility Churn

Contribute a `type: "webview"` view in its own activity-bar container and register a
`WebviewViewProvider` without `retainContextWhenHidden`. The scenario shows the view,
switches to Explorer and back, moves the view to a panel container (`Churn Dock`) and
back with `vscode.moveViews`, then hides it again.

The fixture counts resolves, disposals, visibility changes and `ready` messages posted
by the page. Its `Expect Ready` and `Expect Hidden` commands wait for those signals and
report them in a completion notification; an `Expect Ready` needs a `ready` newer than
the previous one, so every show must reload the page. Each Expect command also checks
that at most one webview view is live (`resolves - disposals <= 1`).

Observed on VS Code 1.147.0: a plain hide releases the webview frame but does not
re-resolve the provider, while each move disposes the pane and resolves a new view.
The scenario asserts the frame location by geometry (side bar, panel, or no frame), and
setup and teardown require that no frame for this extension remains.

View locations persist in the profile, so Setup always moves the view home and Cleanup
moves it home when it was moved. The provider stays registered for the extension's
lifetime because an already-activated pane does not resolve again after re-registration.

```sh
xvfb-run -a node packages/cli/bin/test.js \
  --only '^webview-view-visibility-churn.ts' --runs 5 \
  --enable-extensions --run-skipped-tests-anyway \
  --check-leaks --measure-after --measure iframe-count
```

This is an opt-in workload. Inspect the test summary line, not just the exit status:
a forced skipped scenario that fails prints `1 skipped-failed` and still exits 0.
