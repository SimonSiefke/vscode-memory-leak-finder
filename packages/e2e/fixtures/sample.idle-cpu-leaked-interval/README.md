# Idle CPU Leaked Interval

Positive control for the `idle-cpu-after-scenario` measure. Each run leaks one
`setInterval` in the extension host that busy-waits for 5 ms every 100 ms, up to
four intervals. Cleanup clears them.

With `--measure-after`, the two warm-up runs leave two intervals running in the
pre-scenario idle window and two more runs leave four running in the
post-scenario window, so the extension host (`node.mojom.NodeService` utility)
should show roughly +300 ms of idle CPU over a 3 second window.

```sh
xvfb-run -a node packages/cli/bin/test.js --cwd packages/e2e \
  --only ^idle-cpu-leaked-interval.ts --runs 2 \
  --enable-extensions --run-skipped-tests-anyway \
  --measure idle-cpu-after-scenario --measure-after --timeout-between 2000
```

The scenario is skipped by default and in CI because it burns CPU on purpose.
Compare it with `--only ^base.ts` using the same flags.
