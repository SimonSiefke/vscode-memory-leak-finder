# linux-process-limits

Tracks per-process resources that can run out before resident memory grows: threads, inotify watches and instances, and virtual address space. Linux only. It reads the application's root process and all of its current descendants:

```sh
node packages/cli/bin/test.js --cwd packages/e2e --measure-after --measure linux-process-limits --only explorer-expand-and-collapse
```

Each snapshot records, for every process (identified by PID plus kernel start time):

- `threads`, `vmSizeBytes` and `vmPeakBytes` from `/proc/<pid>/status`. `vmPeakBytes` is the lifetime peak and is never reset;
- `inotifyInstances`: file descriptors that link to `anon_inode:inotify`;
- `inotifyWatches`: `inotify wd:` lines in those descriptors' `/proc/<pid>/fdinfo` entries.

It also reads `fs.inotify.max_user_watches`, `fs.inotify.max_user_instances` and `kernel.threads-max` for context. Unreadable limits are `null`. The inotify limits apply per user, not per process tree, so the tree's usage is a lower bound on what counts against them.

The result contains:

- `totals.before`, `totals.after` and `totals.delta` for threads, inotify instances and inotify watches;
- per-process `rows` with `started`, `exited` or `running` status. A reused PID shows up as one exit and one start;
- `largestVmSizeDeltaBytes`, the largest virtual-size change of a process running in both snapshots;
- `growth`, which lists the tree totals that increased, plus `vmSize` when `largestVmSizeDeltaBytes` is at least 1 GiB. Allocators and thread stacks routinely move virtual size by a few megabytes;
- `limits` and both raw snapshots.

Virtual sizes are not summed across processes. V8 processes reserve terabytes of address space, and a `WebAssembly.Memory` typically reserves about 8 GiB that never becomes resident. That makes `vmSize` growth a lead for leaked wasm instances, which PSS-based measures miss. Note that `file-watcher-count` counts inotify instances, so it misses watches added to an existing instance.

The measure always reports `isLeak: false`, and growth is not proof of a leak. A watched folder tree, for example, legitimately adds watches. If a descendant's `fd` or `fdinfo` cannot be read, its inotify counts and the affected totals are `null`, the error is kept in the snapshot, and `complete` is `false`. A descendant whose `status` cannot be read is left out with an error. Failure to read the root process fails the measure.
