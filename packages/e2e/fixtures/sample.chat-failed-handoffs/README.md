# Failed inline chat handoffs

This scenario uses a local language-model registration and a default chat participant for the editor and panel. The participant creates one inline edit and answers the recovery panel request with Markdown. It never requests a model, account, API key, audio device or remote service. Setup saves the isolated profile's harness preferences, selects the local harness for both entry points, and restores the settings during cleanup.

The test starts real inline chat, waits for the participant's edit, and invokes the built-in `inline_chat_exit` tool through `vscode.lm.invokeTool` with the real request token. It requires the tool's successful result before dispatching the real continuation action. This makes the action eligible through the same termination transition used by a real provider. A renderer probe observes the temporary reference created by the handoff. It injects a panel-opening error only after that acquisition, then repeats with disposal of the source inline session during opening to cancel the handoff. Each case requires one new acquisition, entry into the opening boundary, the expected error, completion of the asynchronous controller operation, and disposal of the real failed target model. A successful continuation and completed local participant response establish recovery.

The action's command handler does not return the asynchronous continuation Promise. The probe observes controller completion directly, so a returned command or notification cannot stand in for the lifetime transition. It waits for the chat service's pending disposal work before inspecting model disposal. Only weak references to models, sessions and services are retained by the probe; scalar counters record the path. Teardown restores the patched prototypes, removes chats, rejects inline edits, closes the editor, deletes the fixture file, and disposes the provider and participant.

Run against an unbundled development build:

```sh
mkdir -p /tmp/vmlf-handoff-runtime
chmod 700 /tmp/vmlf-handoff-runtime
export XDG_RUNTIME_DIR=/tmp/vmlf-handoff-runtime
xvfb-run -a node packages/cli/bin/test.js \
  --cwd packages/e2e --only '^chat-failed-handoffs.ts' --runs 7 --workers 1 \
  --enable-extensions --use-proxy-mock --run-skipped-tests-anyway \
  --measure named-function-count3 --measure-after --check-leaks \
  --vscode-path /absolute/path/to/vscode/scripts/code.sh
```

On Linux, choose a short, unique runtime directory: long worktree paths can otherwise exceed the Unix socket path limit during startup.

The measured owner is the renderer. With `--measure-after`, the harness runs two warmup iterations before the measured repeats. Each iteration releases its inline sessions and deletes its panel chats before the next iteration. The participant's counters and provider registrations live in the extension host and do not retain renderer models.

This scenario is opt-in because its ownership probe imports private modules from an unbundled development build. It requires the editor/panel default-participant proposals and the handoff's debug owner. Bundled releases and builds with different internals are unsupported. Missing acquisition, missing continuation, a premature provider failure, or an incomplete recovery must fail. Inspect the suite verdict: opt-in scenario failures can appear as `skipped-failed` while the CLI exits zero.

Direct voice-tool fallback is outside this scenario. The local chat participant API cannot dispatch voice tools or install the voice widget's delegate. Substituting a synthetic delegate and directly calling the dispatch service would test service logic rather than the real voice UI. A future voice e2e needs a local voice transport fixture that drives the actual widget's tool-call dispatch and observes its target replacement without an account, microphone or external service.

## Validation

Validated with an unbundled Code OSS 1.146.0 development build, using the repositories' declared Node versions. A one-iteration smoke passed. Two warmups and seven measured iterations then completed all ownership and recovery assertions: 18 failed handoffs and nine successful recoveries. Exact renderer heap object counts were **three ChatModel objects before and three after** the seven measured repeats.

The broad `named-function-count3` result was **not clean**: it reported 16 growing rows in artifact, customization telemetry, side-chat and observable code, including 14 additional `UnifiedChatArtifacts` objects. Those rows did not include growing ChatModel objects. This scenario checks the temporary handoff references; it does not establish that every chat service is leak-free or suppress the broad measure's leak verdict.

Sensitivity was verified on the same build and launch settings by temporarily suppressing the underlying disposal call in the reference observer while retaining its invocation counter. The real target model stayed alive, and the scenario failed with `Failed handoff ChatModel remains live`. Restoring disposal allowed the ownership assertions and stable ChatModel counts above. The negative control stops before heap capture; this is a controlled cleanup reversal, not an affected-release heap comparison.
