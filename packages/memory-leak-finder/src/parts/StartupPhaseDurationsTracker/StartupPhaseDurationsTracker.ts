// Serialized into a separate realm; coverage counters would reference the host scope.
/* istanbul ignore next */
export const install = () => {
  'use strict'
  const realm = globalThis as any
  const performance = realm.performance
  if (typeof performance?.getEntriesByType !== 'function') {
    const reason = 'Performance Timeline is unavailable'
    return { available: false, reason, snapshot: () => ({ available: false, reason, metrics: {}, rows: [] }), dispose() {} }
  }
  const from = performance.now()
  return {
    snapshot: () => {
      const entries = performance.getEntriesByType('measure').filter((entry: any) => entry.startTime >= from)
      const marks = performance.getEntriesByType('mark')
      const phases = [
        ['rendererToWorkbench', 'code/didStartRenderer', 'code/didStartWorkbench'],
        ['workbenchInitialization', 'code/willStartWorkbench', 'code/didStartWorkbench'],
        ['mainToRenderer', 'code/didStartMain', 'code/didStartRenderer'],
      ]
      const rows = entries.map((entry: any) => ({
        name: entry.name,
        count: 1,
        durationMs: entry.duration,
        startTimeMs: entry.startTime,
        source: 'performance.measure',
      }))
      const unavailablePhases: string[] = []
      for (const [name, start, end] of phases) {
        const starts = marks.filter((entry: any) => entry.name === start).sort((a: any, b: any) => a.startTime - b.startTime)
        const ends = marks.filter((entry: any) => entry.name === end).sort((a: any, b: any) => a.startTime - b.startTime)
        let matched = false
        for (const finish of ends) {
          const begin = starts.filter((entry: any) => entry.startTime <= finish.startTime).at(-1)
          if (begin) {
            rows.push({
              name,
              count: 1,
              durationMs: finish.startTime - begin.startTime,
              startTimeMs: begin.startTime,
              source: 'startup marks',
            })
            matched = true
          }
        }
        if (!matched) unavailablePhases.push(name)
      }
      return {
        available: true,
        metrics: { phaseCount: rows.length, unavailablePhaseCount: unavailablePhases.length },
        rows,
        unavailablePhases,
        coverage:
          'New performance.measure entries plus known startup mark pairs already retained in the selected renderer timeline. Cross-process marks require a shared clock/timeline; absent marks are unavailable. Overlapping phase durations are not summed.',
      }
    },
    dispose() {},
  }
}
