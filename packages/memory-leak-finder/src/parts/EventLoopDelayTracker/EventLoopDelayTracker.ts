export const install = () => {
  'use strict'
  const realm = globalThis as any
  let hooks: any
  try {
    hooks = realm.process?.getBuiltinModule?.('node:perf_hooks') || realm.require?.('node:perf_hooks')
  } catch {}
  const reason = 'Node perf_hooks event-loop monitoring is unavailable'
  if (!hooks?.monitorEventLoopDelay || !hooks.performance?.eventLoopUtilization)
    return { available: false, reason, snapshot: () => ({ available: false, reason, metrics: {}, rows: [] }), dispose() {} }
  const histogram = hooks.monitorEventLoopDelay({ resolution: 10 })
  const before = hooks.performance.eventLoopUtilization()
  histogram.enable()
  return {
    snapshot: () => {
      const delta = hooks.performance.eventLoopUtilization(before)
      const sampleCount = Number(histogram.count)
      return {
        available: true,
        metrics: {
          activeMs: delta.active,
          idleMs: delta.idle,
          utilizationRatio: delta.utilization,
          sampleCount,
          meanDelayMs: sampleCount ? histogram.mean / 1e6 : null,
          p95DelayMs: sampleCount ? histogram.percentile(95) / 1e6 : null,
          maxDelayMs: sampleCount ? histogram.max / 1e6 : null,
        },
        rows: [],
        resolutionMs: 10,
        coverage:
          'Selected Node event loop. Utilization is loop activity, not CPU usage. Delay needs timer samples and does not cover earlier startup.',
      }
    },
    dispose: () => histogram.disable(),
  }
}
