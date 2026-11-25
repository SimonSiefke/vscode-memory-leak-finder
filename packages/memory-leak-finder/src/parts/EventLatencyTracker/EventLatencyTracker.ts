// Serialized into a separate realm; coverage counters would reference the host scope.
/* istanbul ignore next */
export const install = () => {
  'use strict'
  const realm = globalThis as any
  const durationThresholdMs = 16
  const maxEntries = 5000
  const maxRows = 20
  const Observer = realm.PerformanceObserver
  const performance = realm.performance
  const unavailable = (reason: string) => ({
    available: false,
    reason,
    snapshot: () => ({ available: false, reason, metrics: {}, rows: [] }),
    dispose() {},
  })
  if (typeof Observer !== 'function' || !Observer.supportedEntryTypes?.includes?.('event') || typeof performance?.now !== 'function')
    return unavailable('Event Timing (PerformanceObserver entry type "event") is unavailable in this target')
  const readCounts = () => {
    const counts: Record<string, number> = Object.create(null)
    try {
      performance.eventCounts?.forEach((count: number, type: string) => {
        counts[type] = count
      })
    } catch {}
    return counts
  }
  const hasEventCounts = typeof performance.eventCounts?.forEach === 'function'
  const countsBefore = hasEventCounts ? readCounts() : undefined
  const entries: {
    name: string
    startTime: number
    duration: number
    processingStart: number
    processingEnd: number
    interactionId: number
  }[] = []
  let overflowCount = 0
  const startMark = performance.now()
  const record = (list: any[]) => {
    for (const entry of list) {
      // Not buffered and filtered by start time, so startup input before the window is excluded.
      if (!(entry.startTime >= startMark)) continue
      if (entries.length >= maxEntries) {
        overflowCount++
        continue
      }
      entries.push({
        name: String(entry.name),
        startTime: entry.startTime,
        duration: entry.duration,
        processingStart: entry.processingStart,
        processingEnd: entry.processingEnd,
        interactionId: Number(entry.interactionId) || 0,
      })
    }
  }
  let observer: any
  try {
    observer = new Observer((list: any) => record(list.getEntries()))
    observer.observe({ type: 'event', durationThreshold: durationThresholdMs })
  } catch (error) {
    try {
      observer?.disconnect()
    } catch {}
    return unavailable(`Event Timing observer could not be started: ${error}`)
  }
  const percentile = (sorted: number[], p: number) => (sorted.length ? sorted[Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)] : null)
  const stats = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b)
    return { p50: percentile(sorted, 50), p95: percentile(sorted, 95), max: sorted.length ? sorted[sorted.length - 1] : null }
  }
  return {
    snapshot: () => {
      record(observer.takeRecords())
      const byName = new Map<string, number[]>()
      const interactions = new Map<number, number>()
      for (const entry of entries) {
        const durations = byName.get(entry.name) || []
        durations.push(entry.duration)
        byName.set(entry.name, durations)
        if (entry.interactionId) interactions.set(entry.interactionId, Math.max(interactions.get(entry.interactionId) || 0, entry.duration))
      }
      const events: Record<
        string,
        { count: number; p50DurationMs: number | null; p95DurationMs: number | null; maxDurationMs: number | null }
      > = Object.create(null)
      for (const [name, durations] of [...byName].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
        const { p50, p95, max } = stats(durations)
        events[name] = { count: durations.length, p50DurationMs: p50, p95DurationMs: p95, maxDurationMs: max }
      }
      const all = stats(entries.map((entry) => entry.duration))
      const interaction = stats([...interactions.values()])
      const metrics: Record<string, number | null> = {
        slowEventCount: entries.length + overflowCount,
        droppedEventCount: overflowCount,
        interactionCount: interactions.size,
        p50DurationMs: all.p50,
        p95DurationMs: all.p95,
        maxDurationMs: all.max,
        p95InteractionDurationMs: interaction.p95,
        maxInteractionDurationMs: interaction.max,
      }
      const result: any = {
        available: true,
        metrics,
        events,
        rows: [...entries]
          .sort((a, b) => b.duration - a.duration || a.startTime - b.startTime)
          .slice(0, maxRows)
          .map((entry) => ({
            name: entry.name,
            durationMs: entry.duration,
            inputDelayMs: entry.processingStart - entry.startTime,
            processingMs: entry.processingEnd - entry.processingStart,
            presentationDelayMs: Math.max(0, entry.startTime + entry.duration - entry.processingEnd),
            interactionId: entry.interactionId,
            startMs: entry.startTime - startMark,
          })),
        durationThresholdMs,
        durationResolutionMs: 8,
        coverage:
          'Trusted input in the selected page only, from measurement start. Only events of at least 16 ms are reported; durations are rounded to 8 ms. Webviews and iframes are not covered.',
      }
      if (overflowCount) result.incomplete = true
      if (countsBefore) {
        const countsAfter = readCounts()
        const eventCounts: Record<string, number> = Object.create(null)
        let total = 0
        for (const type of Object.keys(countsAfter).sort()) {
          const delta = countsAfter[type] - (countsBefore[type] || 0)
          if (delta > 0) {
            eventCounts[type] = delta
            total += delta
          }
        }
        result.eventCounts = eventCounts
        metrics.eventCount = total
      }
      return result
    },
    dispose: () => {
      observer.disconnect()
      entries.length = 0
    },
  }
}
