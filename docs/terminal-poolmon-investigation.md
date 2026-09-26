# Terminal disposal and PoolMon

## Experiment

This investigation uses official VS Code 1.137.0 and the existing `terminal-split` scenario. That scenario keeps one original terminal open, repeatedly splits it, and kills the second terminal. Comparing its final process count to zero terminals would therefore be incorrect.

The dedicated Windows workflow runs four fresh-profile trials, each with two warmups:

1. An idle control: keep one terminal open and wait 1.5 seconds per iteration, 37 times. This approximates pacing; it is not an exact duration-matched control.
2. One measured split/dispose cycle.
3. 37 measured split/dispose cycles, retaining the original terminal.
4. 37 measured create/split/dispose-all cycles, finishing with no terminals. This variant creates two terminals per cycle and tests complete cleanup, rather than isolating the same amount of creation work.

The snapshots record process identity (PID plus creation time), parent PID, executable path, command line, private memory and working set. This branch adds handle and thread counts from the same CIM query. PoolMon records system-wide paged/nonpaged allocation counts and bytes by tag. Snapshots follow immediately and after 5, 30 and 60 seconds idle.

Kernel pool tags are not process ownership or allocation stacks. They can correlate with terminal activity but cannot by themselves identify an allocation in `node-pty`. Process private-memory growth can also reflect allocator caching rather than live native allocations.

## Original lead

The earlier run 35990640378 showed 11 additional `OpenConsole.exe` processes immediately after `terminal-split`. Its larger pool deltas included `Obtb` (object tables), `Thre` (thread objects), and `NpFc` (named-pipe client control blocks). That run lacked process identities and idle snapshots, so it could not distinguish persistent retention from delayed teardown.

## Windows results

[Run 36042272313](https://github.com/SimonSiefke/vscode-memory-leak-finder/actions/runs/36042272313) completed successfully on Windows 2022 at harness commit `dc43c96aca99`. All four trials passed on their first attempt, with no process-query errors. Raw JSON, invocation metadata and application logs are in its `poolmon-terminal-evidence` artifact.

The pty-host processes were identified as the Code Node utility processes parenting the bundled `node-pty` OpenConsole executable and terminal PowerShell processes. Each PID and creation timestamp stayed unchanged throughout its trial. Parent relationships must also respect creation time: an older process with a reused parent PID is not a descendant of the newer Code process.

| Trial                 | Pty-host PID | Private MiB before → idle 60s | Handles before → idle 60s | Threads before → idle 60s |
| --------------------- | -----------: | ----------------------------: | ------------------------: | ------------------------: |
| Idle control          |         4912 |                   93.8 → 82.4 |                 329 → 327 |                   29 → 26 |
| One split             |         2012 |                 107.4 → 104.3 |                 340 → 342 |                   30 → 28 |
| 37 splits             |         7616 |                 102.0 → 486.4 |                 340 → 630 |                   30 → 64 |
| 37 dispose-all cycles |         5616 |                 114.7 → 477.5 |                 348 → 611 |                   31 → 62 |

The 37-split trial had 15 OpenConsole processes immediately after the loop, falling to the expected one within five seconds. The dispose-all trial had six immediately afterward and zero by five seconds; its terminal PowerShell processes also disappeared. Thus surviving console processes do not explain the remaining pty-host growth.

Resource growth persisted in the host: approximately +384 MiB / +290 handles / +34 threads after 37 splits, and +363 MiB / +263 handles / +31 threads after complete disposal. Memory alone could be allocator caching; persistent handle and thread growth makes outstanding resources a stronger candidate. This is an actionable Windows-specific lead, not yet proof of which component owns the retained resources.

PoolMon adds a correlated kernel signal. The `NpFc` paged-pool tag (named-pipe client control blocks) remained +69,600 bytes / +145 outstanding allocations after 37 splits, and +63,360 bytes / +132 allocations after dispose-all. The idle control had no `NpFc` growth. These deltas were stable from 5 through 60 seconds. The system-wide thread-object and object-table deltas largely recovered, so looking only at total pool bytes or the immediate chart would miss the distinction.

## Windows heap and candidate fix

[Run 36045871171](https://github.com/SimonSiefke/vscode-memory-leak-finder/actions/runs/36045871171) repeated 37 splits while inspecting the Windows pty host, with ten seconds of settling before the final heap measurement. It retained exactly 37 additional `Worker`, `ConoutConnection`, `WindowsPtyAgent`, and `WindowsTerminal` objects, plus 74 sockets. Retaining paths start at live worker handles and reach the connection through the worker error listener. This identifies live resources rather than merely unused allocator capacity.

The bundled `node-pty` version is `1.2.0-beta.15`. Its bundled-ConPTY branch of `WindowsPtyAgent.kill()` calls `ConoutConnection.dispose()` only from a subsequent output `data` listener. A quiet terminal can produce no further data, so its output worker never starts the existing one-second drain timeout. The worker keeps its pipe server alive.

[Draft fix: SimonSiefke/node-pty#1](https://github.com/SimonSiefke/node-pty/pull/1) starts that drain timeout immediately after kill and preserves the listener that resets it for trailing output. It includes a focused lifecycle test and a real quiet-terminal worker-exit test. The production change is one call plus a comment; native binaries are unchanged.

## Validation and CI repairs

[PR checks](https://github.com/SimonSiefke/node-pty/actions/runs/36230304004) pass on Linux x64/ARM64, macOS Intel/ARM64, and Windows x64/ARM64. The Windows process-tree test now waits for the expected shell processes instead of accepting any three descendants: a `vctip.exe` entry previously satisfied the count before Node had started.

The [standalone Windows comparison](https://github.com/SimonSiefke/node-pty/actions/runs/36230639432) passes. Both cleanup regression tests fail against the unchanged baseline; all 60 tests pass against candidate `e82a8204981c`. After two warmups and 37 measured spawn/kill cycles, the final snapshot at 30 seconds records:

| Resource            | Baseline, before → idle 30s | Candidate, before → idle 30s |
| ------------------- | --------------------------: | ---------------------------: |
| Live output workers |                      2 → 39 |                        0 → 0 |
| Private memory      |            49.2 → 547.6 MiB |              19.6 → 22.6 MiB |
| Handles             |                   218 → 514 |                    202 → 202 |
| Threads             |                     15 → 50 |                      13 → 11 |

All 39 candidate workers exited. The standalone workflow uses Windows 2022 because the installed node-gyp could not discover the Windows 2025 Visual Studio toolchain. It also forces TypeScript compilation after restoring candidate source: PowerShell preserves the saved file timestamp, and an incremental build otherwise reused baseline JavaScript. Run 36230326153 is invalid as a candidate comparison for that reason.

The VS Code comparison preserves `node_modules.asar` at the path used by VS Code's dependency resolver. The previous extraction into `node_modules` broke terminal startup even before applying the fix. The repaired workflow repacks the archive, verifies every dependency file's bytes and packed/unpacked status, and retains the original native files. Local validation against the exact Windows 1.137.0 package verified 5,117 files, with only `windowsPtyAgent.js` changed. The archive tests also cover native Windows path separators and reject an unexpected cleanup implementation.

The [VS Code Windows comparison](https://github.com/SimonSiefke/vscode-memory-leak-finder/actions/runs/36230756433) passed at harness revision `36a6afe06110`. The preparation smoke, both 37-split resource trials, and the 37-split candidate heap trial completed on their first attempt with fresh profiles and fresh results. The candidate heap result is `{"namedFunctionCount3": [], "isLeak": false}` after ten seconds of settling.

The pty host was identified through its OpenConsole children and matched across snapshots by PID plus creation timestamp: baseline PID 6020 (`2026-09-26T08:50:08.3789330Z`), candidate PID 4648 (`2026-09-26T08:51:31.1934200Z`). At 60 seconds idle:

| Pty-host resource | Baseline, before → idle 60s | Candidate, before → idle 60s |
| ----------------- | --------------------------: | ---------------------------: |
| Private memory    |           107.4 → 488.3 MiB |             113.6 → 96.5 MiB |
| Handles           |                   340 → 630 |                    340 → 326 |
| Threads           |                     30 → 64 |                      30 → 26 |

System-wide `NpFc` outstanding allocations changed by +143 (+68,640 bytes) on the baseline and −7 (−3,360 bytes) on the candidate. Both resource trials still report an overall PoolMon leak flag because other system counters grow; this does not negate the completed measurements or the recovery of the targeted pty-host resources. The fresh candidate heap has no growing rows, including the four worker/terminal constructors that grew by 37 in the earlier baseline capture.

The archived `patch-hashes.json` confirms that all 5,117 files were verified and the native files remained unchanged. `windowsPtyAgent.js` SHA-256 changed from `bcd9e8aaee138601d8e2e11fb5abec415cbef9525ea67c7307633263ea584256` to `46dcfe29a3ef10b0a45add5628b8fff296ecd3abbd193b0762b2008db46d45e8`. These VS Code results validate the one-call cleanup change against the bundled `node-pty` version; the standalone comparison separately validates the PR source revision.

## Linux pty-host cross-check

Driver revision: `b0c639447f0a84cb7ce4abacd822f519f7d758c9`. Product: official Linux VS Code 1.137.0. The one-iteration split smoke test passed. The repeated test used:

```sh
xvfb-run -a node packages/cli/bin/test.js \
  --only terminal-split --runs 37 --run-skipped-tests-anyway \
  --vscode-version 1.137.0 --vscode-path /path/to/code \
  --inspect-ptyhost --measure named-function-count3 --check-leaks --measure-after
```

The immediate result contained one growing row: `Timeout`, delta 40, final count 53. Heap retaining paths mostly traversed Node timer lists scheduled around 5,000 milliseconds; some reached terminal child-process monitors and their debounce timers.

Repeating the same command with `--timeout-between 10000` produced `{"namedFunctionCount3": [], "isLeak": false}`. Thus the immediate timer growth did not persist through ten seconds of settling in this run. This is not evidence of a permanent pty-host JavaScript leak, and the Linux check does not validate Windows ConPTY behavior.

Local raw heaps, JSON and logs are under `.tmp/linux-pty` and `.tmp/linux-pty-idle` in the diagnostic worktree. The counter parser's 12 tests, memory-leak-finder typechecking, and the complete-disposal scenario's local smoke test passed.
