# linux-process-io

Linux only. Run an existing scenario with `--measure-after --measure linux-process-io`:

```sh
node packages/cli/bin/test.js --cwd packages/e2e --measure-after --measure linux-process-io --only ^base.ts
```

The measure reads `/proc/<pid>/io` for the application root process and its current descendants when the scenario measurement starts and again when it stops. It reports how many bytes each process moved during that window. It returns `isLeak: false`; it is a diagnostic and does not apply a threshold.

## Two layers, never added together

| Field                 | Kernel name             | Meaning                                                                                                                                                   |
| --------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rchar`, `wchar`      | `rchar`, `wchar`        | Bytes passed to read and write syscalls, including pipes, sockets, terminals and page-cache hits.                                                         |
| `syscr`, `syscw`      | `syscr`, `syscw`        | Number of read and write syscalls.                                                                                                                        |
| `readBytes`           | `read_bytes`            | Bytes the storage layer fetched for the process.                                                                                                          |
| `writeBytes`          | `write_bytes`           | Bytes the process caused to be written to storage. The kernel attributes them when pages are dirtied, so later writeback still counts against the writer. |
| `cancelledWriteBytes` | `cancelled_write_bytes` | Dirty bytes that were never written, for example because the file was truncated or deleted first.                                                         |

`wchar` and `writeBytes` measure the same write at different layers, so adding them double-counts. tmpfs files have no storage layer and only appear in `rchar`/`wchar`. Use `writeBytes` for log, cache and state growth on disk, and `rchar`/`wchar` for pipe and socket traffic volume, such as the traffic between a language server and the extension host.

## Result

`linuxProcessIo.rows` has one row per process, identified by PID plus kernel start time so a reused PID is not mistaken for the same process:

- `running`: present in both snapshots; `delta` is after minus before.
- `started`: started during the window; `delta` holds its lifetime counters, all of which accrued inside the window.
- `exited`: present only before; its own counters are gone, so `after` and `delta` are `null`.

`totals` sums each field over `running` rows only. `complete` is `false` when any process started, exited, or could not be read. Rows are ranked by `writeBytes`, then `wchar`, and the summary names the top writer for each.

When a process reaps an exited child, the kernel adds the child's lifetime counters to the parent's `/proc/<pid>/io`. A short-lived command that runs entirely inside the window, such as a script started in the integrated terminal, has no row of its own but appears in its parent's delta (for example the terminal's shell). An `exited` child that was already running before the window adds its pre-window I/O to the parent too, so in that case the parent's delta overstates the window. A child reaped by a process outside the tree, or not yet reaped, is missed.

## Caveats

- Reading another process's `io` needs ptrace read permission. The harness launches the application as the same user, so this normally works. An unreadable process (for example `EACCES`) is recorded in `errors` with its code instead of being counted as zero.
- The browser (main) process's `rchar`/`wchar` can include the harness's own DevTools protocol traffic. Compare it against a control scenario such as `base` instead of reading it in isolation.
- A process's counters include all of its threads, including threads that have exited.
- On other platforms, or without a root PID, the result has `available: false` with an `unavailableReason`; the run does not fail.
