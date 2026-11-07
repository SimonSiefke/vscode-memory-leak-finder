# Agents window regression scenarios

The Inbox canvas subscription scenario uses the real agent host, bundled SDK,
renderer and native canvas presentation. Its SDK extension serves a loopback-only
HTML page. The existing HTTP fixture supplies model metadata and text responses;
no account, live model or external service is required. Unexpected proxy requests
remain blocked.

Run with the repository's pinned Node version after `npm run install:ci`:

```sh
node packages/cli/bin/test.js --cwd packages/agents-e2e \
  --launch-agent-window --enable-extensions --use-proxy-mock \
  --only agents-window-inbox-canvas-subscriptions.ts \
  --vscode-version 1.145.0 --runs 1
```

On Linux, long checkout paths can exceed the Unix socket path limit before VS
Code creates a window. Set `XDG_RUNTIME_DIR` to a short, private directory (mode 700) when the checkout's `.vscode-runtime-dir` path exceeds the harness limit.
Remove an inherited `NODE_DISABLE_COMPILE_CACHE` setting if the packaged runtime
reports it as unexpected startup stderr. CI prepares a short runtime directory.

The scenario warms up with one pair of sessions and repeats with two distinct
pairs. Each pair checks that switching to a real peer session releases the first
canvas, Inbox evidence acquires it again, hiding native content keeps the evidence
list's lease, and closing evidence releases the last lease while the peer remains
subscribed. Readiness requires a completed mocked response, an SDK session matching
the exact prompt, a server-published canvas URI, real wire subscriptions and a
visible native canvas container with its actual HTML content. The SDK open happens after renderer/SDK attachment;
opening inside `joinSession` can precede the product's event listeners.

Ordinary UI readers are often disposed during a session switch, allowing an
always-active gate to pass a UI-only scenario. The test therefore uses a temporary
renderer debugger breakpoint at the real canvas factory to capture the UI-created
session adapter. It attaches an ordinary observer to that chat's actual canvas
observable without acquiring an observation lease. This reader remains alive
while the session is inactive and discards its read values. All debugger handles
and listeners are released before traffic assertions; the observer is removed
between pairs and during failure cleanup. No subscription heap objects are queried
or retained. The factory must resolve exactly once and debugger listeners must be
exclusive, otherwise readiness fails. This hook is coupled to the pinned product
version and must be revalidated with a controlled reversal when updated.

The oracle reads the window's local AHP JSONL traffic. It tracks subscriptions by
connection and resource, rejects truncated/dropped captures, ignores incomplete
final writes and checks the active peer is never unsubscribed. The harness retains
only identifiers and serialized traffic, not handles to renderer objects. This
is a resource-lifetime assertion, not a heap-size threshold or an assertion about
all unrelated session observers. The scenario closes session surfaces and attempts
to delete every conversation on failure as well as success. The launcher restores
settings and removes its SDK extension; the SDK owns the extension processes and
their loopback servers.

The UI selectors and canvas protocol target VS Code 1.145.0. Other versions must
pass the readiness assertions rather than silently skipping unsupported paths.

## Sensitivity validation

On Linux with the pinned Node version and VS Code 1.145.0, all three pairs pass.
Forcing the real canvas factory's active/lease gate to always true fails at the
inactive-canvas assertion: the target remains subscribed while the active peer
stays subscribed. Restoring the original binary bytes passes the three pairs
again under the same settings. The UI-only variant without the retained ordinary
reader passes that reversal, so the retained-reader fixture is essential.

This validates canvas subscription gating, including its session/chat observation
path. It does not assert that unrelated consumers release every session/chat
channel, or substitute for a general heap-retention measurement.
