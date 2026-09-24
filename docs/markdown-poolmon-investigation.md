# Markdown preview memory investigation

## Windows process-memory results

The [baseline run](https://github.com/SimonSiefke/vscode-memory-leak-finder/actions/runs/36021291130) used official VS Code 1.137.0 on Windows 2022. Each trial started with a fresh profile, ran two warmups and then the listed measured iterations of `markdown-preview-side-by-side`, and closed the editors after each iteration. PoolMon process snapshots include PID, creation time, command line, working set and private memory. Idle snapshots were taken at 5, 30 and 60 seconds.

The growing process was the secondary renderer used for previews. There were 11 Code processes in every snapshot; this was not an accumulation of processes.

| Measured iterations | Preview renderer private MiB before | Immediate | After 60 seconds idle |
| ------------------: | ----------------------------------: | --------: | --------------------: |
|                   1 |                               586.4 |     774.3 |                 503.7 |
|                  10 |                               583.0 |    1751.5 |                1635.4 |
|                  37 |                               579.3 |    3283.7 |                3108.3 |
|          37, repeat |                               526.4 |    3543.0 |                3399.3 |

All four baseline trials completed on their first attempt. The raw JSON, invocation metadata and application logs are in the run's `poolmon-markdown-evidence` artifact.

## Controlled garbage-collection experiment

The [GC comparison](https://github.com/SimonSiefke/vscode-memory-leak-finder/actions/runs/36022761586) used the same product and fresh profiles, with 37 measured iterations plus two warmups. The diagnostic scenario queried preview heap usage and DOM counters in both trials. Only the second trial requested `HeapProfiler.collectGarbage` before closing the previews in each iteration.

| Trial        | Preview renderer private MiB before | Immediate | After 60 seconds idle |
| ------------ | ----------------------------------: | --------: | --------------------: |
| No forced GC |                               565.4 |    4262.9 |                4080.7 |
| Forced GC    |                               424.8 |     434.3 |                  56.1 |

Without forced GC, the final live-preview heap query reported 1,987,477,911 bytes of backing storage, 92,387,384 bytes of used JavaScript heap, and 18 documents / 400 DOM nodes. The final forced-GC query reported 26,814,058 bytes of backing storage, 4,954,712 bytes of used heap, and 5 documents / 134 nodes. These queries occur before closing the active previews; they are not the 60-second process snapshots. The two preview frames can share a renderer/isolate, so their heap totals must not be added together. The harness repeats logs in its summary; deduplicate queries by CDP session ID and response ID.

The no-GC trial had two invalid UI attempts (a destroyed execution context and a quick-pick timeout), then completed on attempt three. The forced-GC trial completed on attempt one. Failed attempts are preserved and excluded from the results.

This experiment strongly implicates delayed reclamation in the large renderer increase. Idle time alone did not release it, but explicit collection prevented the accumulation. It does not identify the backing-storage owner, establish a permanent product leak, or exclude debugger effects. Forced GC is diagnostic instrumentation, not a proposed production fix.

## Separate extension-host leak

A Linux extension-host heap comparison of the original scenario on official VS Code 1.137.0 found 37 additional `ExtHostEditorTabGroup` instances after 37 iterations, plus matching API getters and callbacks. The workbench-renderer named-function comparison was clean; it did not measure the preview renderer's native/private memory.

The extension-host retaining path runs through product state:

```text
ExtHostEditorTabs service
  -> current _extHostTabGroups entry
  -> _activeGroupIdGetter callback
  -> shared closure context
  -> existingGroupsById Map from a previous model update
  -> closed ExtHostEditorTabGroup
  -> its callback / previous Map / older closed group ...
```

The After heap contained 40 group instances while the service's live array contained only one group. Creating the active-group getter once on the service, outside `$acceptEditorTabModel`, avoids capturing the per-update maps. This is a genuine retained-object leak, independently of the large preview-renderer increase above.

A focused Node regression test replaces a group, requests inspector GC and asserts that a WeakRef to the closed group's DTO clears while the service remains live. It fails with the original callback and passes with the service-level callback. Existing tab API behavior tests, focused lint and client typechecking also pass.

## Same-revision source validation

The fix is on [SimonSiefke/vscode branch `fix/memory-leak-tab-group-callback`](https://github.com/SimonSiefke/vscode/tree/fix/memory-leak-tab-group-callback), commit `209f26ff11d147aecd362e0d4abe95cd71783cb3`. No VS Code pull request was opened.

Both Linux products were built independently from base `041d1b6643abf1aae6c94c0877cb4699a028ca0d` (1.139.0), using Node 24.18.0. Sequential client, extension and Copilot builds completed; all 35 built-in extension entrypoints and the codicon font were present. Each product passed a one-iteration smoke test without missing-module or extension-activation failures.

Driver revision: `b0c639447f0a84cb7ce4abacd822f519f7d758c9`, Node 24.15.0. Both measurements used the original `markdown-preview-side-by-side` scenario, built-in extensions only, default network mode, identical profile-cleanup behavior, two warmups and 37 measured iterations. The shared built-in extension cache was rotated when switching products.

```sh
xvfb-run -a node packages/cli/bin/test.js \
  --only markdown-preview-side-by-side --runs 37 --run-skipped-tests-anyway \
  --vscode-version 1.139.0 --vscode-path /path/to/product/scripts/code.sh \
  --inspect-extensions --measure named-function-count3 --check-leaks --measure-after
```

| Product  | Tab-group growth | Other growing rows                           | Verdict |  Duration |
| -------- | ---------------: | -------------------------------------------- | ------- | --------: |
| Baseline |              +37 | Five matching callback/getter rows, each +37 | LEAK    | 137.052 s |
| Fixed    |   No growing row | None                                         | PASS    | 135.176 s |

The fixed result is `{"namedFunctionCount3": [], "isLeak": false}`. The new GC regression test passes on the rebuilt fixed product and fails with the original callback. All 16 existing tab API behavior tests also pass, as do focused lint, client typechecking and the commit hygiene checks.

Local raw heaps, JSON, run logs, a standard build-charts Before SVG, and regression-test logs are preserved under `.tmp/source-comparison` in the diagnostic worktree. There is no After SVG because build-charts intentionally omits clean named-function results. This validates the tab-group fix on Linux; it does not claim a patched Windows build was tested or that this small extension-host leak explains the multi-gigabyte renderer spike.

## Running the diagnostic

Dispatch `.github/workflows/poolmon-markdown.yml` on `diagnostic/poolmon-markdown` with `mode=baseline` for the scaling trials or `mode=gc` for the controlled comparison. The workflow preserves invalid attempts and retries each trial at most three times. Kernel-pool leak flags are recorded as evidence; missing results, process-query failures and exhausted UI retries fail the job.

Local source checkouts can already be exercised using the harness's explicit `--vscode-path /path/to/vscode/scripts/code.sh`. A Windows source comparison requires a separately built Windows executable; the existing commit-download helper does not implement a native Windows source-build path. This workflow currently tests the official release, not a patched Windows VS Code build.
