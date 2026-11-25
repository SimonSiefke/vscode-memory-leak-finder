# libuv-handle-census

Counts native libuv handles by type in a Node.js process, including handles that existed before the measurement started. Use it for the Electron main process, the extension host, or a language server:

```sh
# Language server process (Node mode of the same binary)
--inspect-process htmlServerMain --measure libuv-handle-census --measure-after
# Extension host
--inspect-extensions --measure libuv-handle-census --measure-after
# Electron main process
--measure-node --measure libuv-handle-census --measure-after
```

Each snapshot is one `process.report.getReport()` call made with `excludeNetwork` enabled (the previous value is restored). The full report contains environment variables, paths, command lines, network interfaces and socket endpoints, so the collector filters it inside the target and keeps only:

- `handles[type]`: `total`, `active` and `referenced` counts, plus `repeatingUvTimerCount`;
- `resourceUsage`: `maxRss`, `pageFaults`, `fsActivity`, `userCpuSeconds` and `kernelCpuSeconds`;
- numeric `javascriptHeap` totals and `workerCount`.

The result stores both snapshots and the per-type `handleDeltas`. `suspectedTypes` lists handle types whose total grew by at least one per run. The measure always reports `isLeak: false`; handle growth is a lead, not proof of a leak. Units:

- `maxRss` is the lifetime peak RSS in bytes and is never reset between snapshots.
- `fsActivity` values are operation counts, not bytes.
- JavaScript timers share one native timer, so `repeatingUvTimerCount` only counts native repeating timers.

If the inspected process changes between snapshots (a different PID), `processChanged` is `true` and no deltas are reported. Targets without `process.report`, such as the workbench renderer, return `available: false`. If `getReport()` throws, the result is `available: false` with only the error message.
