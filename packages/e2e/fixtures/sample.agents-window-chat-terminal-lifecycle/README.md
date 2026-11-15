# Chat-window terminal fixture

Creates real Bash editor terminals through the extension API and writes only their
names, persistence flags and process IDs to the scenario's isolated workspace.
Snapshot and cleanup commands enumerate the public terminal API; the extension
keeps no terminal handles between commands. A session task writes its own actual
shell PID and working-directory record.

The scenario checks process IDs together with Linux `/proc` start times, so PID
reuse cannot satisfy an ownership assertion. Close/reopen and session switching
must preserve both editor shells. Hiding and rerunning the dedicated session task
must reuse its shell. Archive and deletion run on fresh sessions and require all
recorded editor/task shells to exit before any rescue cleanup.

Reload runs on a separate session. Its transient editor and agent-host task shells
must exit while the local persistent shell remains alive. The API snapshot must
contain that persistent PID exactly once after reconnection and no revived
transient terminal. Extension-created editors can remain detached after reload;
after closing the restored chat surface, the scenario uses the public Attach to
Session picker when required. This is
explicit reattachment, not proof of automatic editor restoration. The reattached
terminal is disposed by the fixture; subsequent deletion is cleanup, not an
assertion about its original session ownership.

Run on Linux with the repository's pinned Node version after `npm run install:ci`:

```sh
mkdir -p /tmp/chat-terminal-runtime
chmod 700 /tmp/chat-terminal-runtime
XDG_RUNTIME_DIR=/tmp/chat-terminal-runtime node packages/cli/bin/test.js \
  --cwd packages/agents-e2e --launch-agent-window --enable-extensions \
  --use-proxy-mock --only agents-window-chat-terminal-lifecycle.ts \
  --vscode-version insiders:d9cccddf6b34357c58b5bbfb60ea03d4c4d1df65 --runs 2
```

Use `xvfb-run -a` before `node` on a displayless host. Unset an inherited
`NODE_DISABLE_COMPILE_CACHE` if the packaged runtime rejects its startup warning.
The pinned runtime is version 1.146.0-insider. Other builds must pass the same
readiness checks; unsupported paths are not skipped. The Linux CI matrix job runs
this scenario with the deterministic local model fixture and blocked external
network requests. The oracle measures resource lifetimes, not heap size.

The pinned build can attach the shell and then report a terminal-ID focus error.
The scenario dismisses only that specific Attach to Session error. It still
requires exactly one API instance with the original PID, then sends a command
through the public terminal API and checks that the original shell writes its own
PID to a fresh marker file. Unexpected dialogs, dead shells, duplicate instances
and failed command round trips fail the scenario. This covers resource reuse;
it does not certify that the reattached terminal can be focused in this build.

## Sensitivity

A controlled reversal of the terminal editor's persistence guard on the pinned
runtime passes warm-up, session deletion and archival, then fails the reload
shell-exit deadline. The agent-host task shell remains alive until failure cleanup.
The original runtime bundle is restored byte for byte before positive reruns.
This negative control validates the reload process-lifetime oracle; it does not
independently validate every other cleanup guard in the product change.

The normal invocation warms up with one Delete cycle, then repeats independent
Delete, Archive and Reload cycles for each requested run. A controlled propagated
`AbortError` after hidden-task reuse also exercises the same failure/cancellation
`finally` path: session cleanup releases all recorded shells and removes the
fixture workspace without rescue kills. Cleanup tolerates Linux `ESRCH` while a
process exits and waits for terminal exit notifications before using its bounded,
PID-and-start-time-scoped rescue path. This cancellation check does not simulate
an operating-system kill of the test runner.

Before hiding or rerunning the task, readiness also requires the renderer's local
AHP capture to contain a successful completion record matching that task's
execution ID. The task uses one `printf` command to append its PID and working directory
together, so compound-command reporting cannot signal readiness halfway through
the fixture. The record write alone cannot satisfy completion. The second invocation
must use the same live connection and terminal channel as the first. Truncated or
dropped captures fail readiness rather than providing a passing result.
