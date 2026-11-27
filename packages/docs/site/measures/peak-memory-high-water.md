# peak-memory-high-water

Run an existing scenario with `--measure-after --measure peak-memory-high-water`. Linux only. The diagnostic returns `isLeak: false`; it reports how high memory went during the measured runs, not what was retained.

At start, the measure writes `5` to `/proc/<pid>/clear_refs` for every process in the application tree, which resets the kernel's resident-set high-water mark (`VmHWM`). At stop it reads `VmHWM` and `VmRSS` again. Spikes that are allocated and freed between the two boundaries are captured even when they are much shorter than any sampling interval.

Each row has `peakRssBytes`, `rssAtResetBytes`, `rssAtStopBytes` and a `window`:

- `since-reset`: the process existed at both boundaries and was reset.
- `process-lifetime`: the process started during the window, so its peak covers its whole life.
- `lifetime-unreset`: the reset was refused (`EACCES`/`EPERM`), so the peak may predate the window and the result is marked incomplete.
- `status: exited` with a null peak: the process ended before stop.

The only aggregate is `largestProcessPeakRssBytes`. Per-process peaks are not summed because RSS double-counts shared pages and the peaks did not happen at the same time. These are RSS high-water marks, not PSS, so do not compare them with the sampled PSS of `linux-process-tree-resources`. The kernel documents `VmHWM` as approximate; treat differences under about 1 MiB as noise.

Chromium's memory-infra dumps write the same `clear_refs` reset, so running DevTools memory tooling, `chromium-memory-dump` or another tracing connection during the window silently lowers the per-process peaks. This cannot be detected; run this measure on its own.

## Cgroup peak

When `LINUX_CGROUP_PATH` is set (same contract as `linux-cgroup-memory`), the measure also opens the cgroup's `memory.peak` once, records the lifetime peak, writes `reset` and keeps that descriptor open until stop. At stop it reads `memory.current` and then the peak through the same descriptor. The `cgroup` object reports `peakChargedBytesSinceReset`, `lifetimePeakChargedBytes`, `currentBytesAtStart`, `currentBytesAtStop`, `resettable` and `consistent`. Charged bytes are simultaneous cgroup-wide usage (anonymous memory, page cache and kernel memory), unlike the per-process RSS values.

Resets on other descriptors of the same `memory.peak` can lower this descriptor's value on some kernels, so do not reset it elsewhere during a run; `consistent: false` flags a peak below the start or stop usage, or above the lifetime peak. A read-only `memory.peak` (older kernels) gives `resettable: false` and only the lifetime peak, and a missing file gives `available: false` while the per-process rows are still reported.

Chromium moves its browser process into a new `app-<name>-<pid>.scope` when it can reach a user systemd over the session bus, which takes the application out of `LINUX_CGROUP_PATH` and fails the membership check. If that happens, launch the harness without a session bus (for example `env -u DBUS_SESSION_BUS_ADDRESS`).
