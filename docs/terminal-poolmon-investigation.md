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

## Next isolation steps

1. Capture the Windows pty-host JavaScript heap after cleanup, looking for surviving Worker, MessagePort, pipe/socket and `node-pty` connection objects and their owners. A Linux heap cannot answer this Windows-specific question.
2. Reproduce spawn/kill cycles directly with the exact bundled `node-pty` and ConPTY versions, outside VS Code, recording the same handles, threads and private memory. This can distinguish a `node-pty`/ConPTY issue from VS Code lifecycle handling without rebuilding VS Code.
3. If handles or native allocations remain without a JavaScript retaining path, capture handle types and native allocation stacks for the identified pty-host PID. Pool tags alone are not sufficient attribution.
4. Follow with output-heavy disposal and rapid resize tests if simple lifecycle retention is resolved; these exercise different buffering and cancellation paths.

No VS Code or `node-pty` production fix is claimed by this diagnostic branch.

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
