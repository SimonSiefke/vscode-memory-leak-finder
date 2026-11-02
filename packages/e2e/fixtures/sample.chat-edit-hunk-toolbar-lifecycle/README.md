# Chat edit hunk toolbar lifecycle

A local mock chat participant streams 24 separated text edits through VS Code's
real chat editing service. No sign-in, Copilot extension, model request, API key,
or captured network recording is needed. Run with the replay proxy to block
unmatched external requests.

The scenario checks that hidden pooled hunk widgets have no toolbars, revealing a
hunk creates one toolbar, moving between hunks releases the previous toolbar, and
moving outside all hunks releases the last toolbar after fade-out. It clicks the
real Keep and Undo actions and verifies the resulting document. Resolving all
remaining edits must remove every hunk and toolbar before the chat is disposed.
Each iteration deletes its chat and closes the editor; teardown deletes the file
and disposes the participant.

```sh
xvfb-run -a node packages/cli/bin/test.js \
  --only chat-edit-hunk-toolbar-lifecycle --runs 7 \
  --enable-extensions --use-proxy-mock --run-skipped-tests-anyway \
  --vscode-path /absolute/path/to/vscode/scripts/code.sh
```

Use a build with lazy chat edit hunk toolbars and the `chatParticipantAdditions`
and `defaultChatParticipant` proposed APIs. The test intentionally fails the
hidden-toolbar assertion on builds that eagerly create a toolbar for each hunk.
It is opt-in because this UI and these APIs vary between VS Code versions. For
renderer retention measurements, add `--measure named-function-count3
--check-leaks --measure-after`. DOM assertions cover toolbar ownership, while
heap results can expose related listener retention; this test does not count
shared menu listeners directly.
