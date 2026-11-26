# File System Provider Virtual Document Lifecycle

Register an in-memory `vmlf-memfs` file system provider, edit and save its
single file through the editor, change it behind the editor's back, close the
editor and unregister the provider. Every cycle registers a fresh provider and
event emitter and disposes both before the next one.

Intended measurement process: extension-host (`named-function-count3` with
`--inspect-extensions`); the renderer `event-listener-count` is also relevant.

The scenario drives each step through the UI and awaits a completion
notification from the fixture; a failed fixture check posts an error
notification instead, so the scenario fails. Each cycle checks that:

- the editor shows the seeded text, and the typed suffix appears at the caret;
- after the save, the provider holds exactly the seed plus the typed suffix;
- after the provider changes its bytes and fires `onDidChangeFile`, the clean
  document reloads them without becoming dirty, and the editor shows them;
- after the editor closes, the extension-host document closes, no tab remains,
  the provider received no further writes, and no `watch` subscription was
  disposed twice.

The number of `watch` subscriptions still live when the provider is
unregistered is report-only, because the workbench does not promise to unwatch
first. Each result goes to the fixture's log output channel.

The document is opened with `vscode.open`. `workspace.openTextDocument` and
`window.showTextDocument(uri)` keep an extension-host model reference alive for
minutes after the editor closes, which would keep the document open into the
next cycle.

Use `--enable-extensions` and a separate driver worktree; if selecting multiple
scenarios, use `--restart-between` so each fixture loads at startup.

```sh
xvfb-run -a node packages/cli/bin/test.js \
  --only '^file-system-provider-virtual-document-lifecycle.ts' --runs 5 \
  --enable-extensions --run-skipped-tests-anyway \
  --measure named-function-count3 --check-leaks --measure-after --inspect-extensions \
  --vscode-version 1.147.0
```

This is an opt-in workload. Inspect the test summary and the fresh result JSON,
not just the exit status.
