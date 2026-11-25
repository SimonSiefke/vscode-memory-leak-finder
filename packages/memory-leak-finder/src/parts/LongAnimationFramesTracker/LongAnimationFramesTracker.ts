// Serialized into a separate realm; coverage counters would reference the host scope.
/* istanbul ignore next */
export const install = () => {
  'use strict'
  const realm = globalThis as any
  const entryType = 'long-animation-frame'
  const maxFrames = 2000
  const maxRows = 1000
  const unattributed = 'unattributed (includes harness-evaluated code)'
  const coverage =
    'Animation frames longer than 50 ms in the selected page realm that started after measurement start. Zero frames does not mean smooth rendering. Chromium attributes only scripts longer than 5 ms; scripts without a source URL, including code evaluated by the harness, share one row.'
  const Observer = realm.PerformanceObserver
  const unavailable = (reason: string) => ({
    available: false,
    reason,
    snapshot: () => ({ available: false, reason, metrics: {}, rows: [] }),
    flush: async () => {},
    dispose() {},
  })
  let supported = false
  try {
    supported =
      typeof Observer === 'function' && typeof realm.performance?.now === 'function' && Observer.supportedEntryTypes?.includes(entryType)
  } catch {}
  if (!supported) return unavailable('Long animation frame timing is unavailable in this context')
  const startMark = realm.performance.now()
  const rows = new Map<string, any>()
  const metrics = {
    frameCount: 0,
    totalDurationMs: 0,
    maxDurationMs: 0,
    totalBlockingDurationMs: 0,
    totalRenderDurationMs: 0,
    totalForcedStyleAndLayoutDurationMs: 0,
    scriptCount: 0,
    totalScriptDurationMs: 0,
    ignoredBeforeStartCount: 0,
    overflowFrameCount: 0,
    overflowRowCount: 0,
  }
  const number = (value: any) => (typeof value === 'number' && Number.isFinite(value) ? value : 0)
  const round = (value: number) => Math.round(value * 1000) / 1000
  const addScript = (script: any) => {
    const durationMs = number(script.duration)
    const forcedMs = number(script.forcedStyleAndLayoutDuration)
    metrics.scriptCount++
    metrics.totalScriptDurationMs += durationMs
    metrics.totalForcedStyleAndLayoutDurationMs += forcedMs
    const sourceURL = String(script.sourceURL || '')
    const sourceFunctionName = String(script.sourceFunctionName || '')
    const sourceCharPosition = typeof script.sourceCharPosition === 'number' ? script.sourceCharPosition : -1
    const invoker = String(script.invoker || '')
    const key = sourceURL ? JSON.stringify([sourceURL, sourceFunctionName, sourceCharPosition, invoker]) : unattributed
    let row = rows.get(key)
    if (!row) {
      if (rows.size >= maxRows) {
        metrics.overflowRowCount++
        return
      }
      const location = sourceCharPosition >= 0 ? `${sourceURL}:${sourceCharPosition}` : sourceURL
      row = sourceURL
        ? {
            name: `${invoker || '<unknown invoker>'} | ${sourceFunctionName || '<anonymous>'} | ${location}`,
            sourceURL,
            sourceFunctionName,
            sourceCharPosition,
            invoker,
            invokerType: String(script.invokerType || ''),
          }
        : { name: unattributed, sourceURL: '' }
      row.count = 0
      row.durationMs = 0
      row.maxDurationMs = 0
      row.forcedStyleAndLayoutDurationMs = 0
      rows.set(key, row)
    }
    row.count++
    row.durationMs += durationMs
    row.maxDurationMs = Math.max(row.maxDurationMs, durationMs)
    row.forcedStyleAndLayoutDurationMs += forcedMs
  }
  let disposed = false
  const addFrame = (entry: any) => {
    if (disposed) return
    const startTime = number(entry.startTime)
    if (startTime < startMark) {
      metrics.ignoredBeforeStartCount++
      return
    }
    if (metrics.frameCount >= maxFrames) {
      metrics.overflowFrameCount++
      return
    }
    const durationMs = number(entry.duration)
    const renderStart = number(entry.renderStart)
    metrics.frameCount++
    metrics.totalDurationMs += durationMs
    metrics.maxDurationMs = Math.max(metrics.maxDurationMs, durationMs)
    metrics.totalBlockingDurationMs += number(entry.blockingDuration)
    if (renderStart > 0) metrics.totalRenderDurationMs += Math.max(0, startTime + durationMs - renderStart)
    for (const script of entry.scripts || []) addScript(script)
  }
  let observer: any
  try {
    observer = new Observer((list: any) => {
      for (const entry of list.getEntries()) addFrame(entry)
    })
    // Buffered entries would replay startup frames that precede the measurement window.
    observer.observe({ type: entryType, buffered: false })
  } catch (error) {
    observer?.disconnect?.()
    return unavailable(`Long animation frame observer failed: ${error instanceof Error ? error.message : String(error)}`)
  }
  return {
    // Lets frames that ended just before stop be queued before snapshot reads them.
    flush: () =>
      new Promise<void>((resolve) => {
        const timeout = setTimeout(resolve, 1000)
        const done = () => {
          clearTimeout(timeout)
          resolve()
        }
        if (typeof realm.requestAnimationFrame !== 'function') return done()
        realm.requestAnimationFrame(() => realm.requestAnimationFrame(done))
      }),
    snapshot: () => {
      if (!disposed) for (const entry of observer.takeRecords?.() || []) addFrame(entry)
      const resultMetrics: Record<string, number> = {}
      for (const [name, value] of Object.entries(metrics)) resultMetrics[name] = round(value)
      return {
        available: true,
        incomplete: metrics.overflowFrameCount > 0 || metrics.overflowRowCount > 0,
        metrics: resultMetrics,
        rows: [...rows.values()]
          .map((row) => ({
            ...row,
            durationMs: round(row.durationMs),
            maxDurationMs: round(row.maxDurationMs),
            forcedStyleAndLayoutDurationMs: round(row.forcedStyleAndLayoutDurationMs),
          }))
          .sort((a, b) => b.durationMs - a.durationMs || b.count - a.count),
        maxFrames,
        maxRows,
        coverage,
      }
    },
    dispose: () => {
      disposed = true
      observer.disconnect()
    },
  }
}
