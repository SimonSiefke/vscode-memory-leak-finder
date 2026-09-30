export const install = () => {
  'use strict'
  const realm = globalThis as any
  const builtin = (name: string): any => {
    if (typeof realm.process?.getBuiltinModule === 'function') return realm.process.getBuiltinModule(name)
    if (typeof realm.require === 'function') return realm.require(name)
    throw new Error('Node built-in module access is unavailable in this context')
  }
  const unavailable = (reason: string) => ({
    available: false,
    reason,
    snapshot: () => ({ available: false, reason, metrics: {}, rows: [] }),
    dispose() {},
  })

  const rows = new Map<string, any>()
  let count = 0,
    durationMs = 0,
    exclusiveDurationMs = 0,
    failureCount = 0,
    overflowCount = 0
  const clock = () => Number(realm.process.hrtime.bigint()) / 1e6
  const frames: { childTime: number }[] = []
  const observe = (name: string, fn: () => any) => {
    const start = clock()
    const frame = { childTime: 0 }
    frames.push(frame)
    let failed = false
    try {
      return fn()
    } catch (error) {
      failed = true
      throw error
    } finally {
      const elapsed = Math.max(0, clock() - start)
      frames.pop()
      if (frames.length) frames[frames.length - 1].childTime += elapsed
      const exclusive = Math.max(0, elapsed - frame.childTime)
      count++
      durationMs += elapsed
      exclusiveDurationMs += exclusive
      failureCount += Number(failed)
      let row = rows.get(name)
      if (!row && rows.size < 1000) {
        row = { name, count: 0, durationMs: 0, exclusiveDurationMs: 0, failureCount: 0 }
        rows.set(name, row)
      }
      if (row) {
        row.count++
        row.durationMs += elapsed
        row.exclusiveDurationMs += exclusive
        row.failureCount += Number(failed)
      } else overflowCount++
    }
  }
  const snapshot = () => ({
    available: true,
    metrics: { count, durationMs, exclusiveDurationMs, failureCount, overflowCount },
    rows: [...rows.values()].sort((a, b) => b.durationMs - a.durationMs),
  })
  const restorers: (() => void)[] = []
  const patch = (object: any, key: string, wrap: (original: Function) => Function) => {
    const descriptor = Object.getOwnPropertyDescriptor(object, key)
    if (!descriptor || typeof descriptor.value !== 'function' || (!descriptor.configurable && !descriptor.writable)) return false
    const wrapped = wrap(descriptor.value)
    Object.defineProperty(object, key, { ...descriptor, value: wrapped })
    restorers.push(() => {
      if (object[key] === wrapped) Object.defineProperty(object, key, descriptor)
    })
    return true
  }
  const dispose = () => {
    for (const restore of restorers.reverse()) restore()
    restorers.length = 0
  }

  let binding: any, module: any
  try {
    binding = realm.process.binding('fs')
    module = builtin('node:module')
  } catch (error) {
    return unavailable(String(error))
  }
  let missingCount = 0,
    fileCount = 0,
    directoryCount = 0,
    asarPathCount = 0
  if (
    !patch(
      binding,
      'internalModuleStat',
      (original) =>
        function (this: any, ...args: any[]) {
          const result = observe(typeof args[0] === 'string' ? args[0] : '<unknown>', () => Reflect.apply(original, this, args))
          if (result < 0) missingCount++
          if (result === 0) fileCount++
          if (result === 1) directoryCount++
          if (typeof args[0] === 'string' && /\.asar(?:[\\/]|$)/.test(args[0])) asarPathCount++
          return result
        },
    )
  )
    return unavailable('internalModuleStat is unavailable or cannot be wrapped')
  // Verify the loader uses this binding; runtimes may retain a different function.
  try {
    module.createRequire(realm.process.cwd() + '/__measure_probe__.cjs').resolve('./__missing_measure_' + realm.process.hrtime.bigint())
  } catch {}
  if (!count) {
    dispose()
    return unavailable('This loader bypasses the exposed internalModuleStat binding')
  }
  count = durationMs = exclusiveDurationMs = failureCount = overflowCount = missingCount = fileCount = directoryCount = asarPathCount = 0
  rows.clear()
  return {
    snapshot: () => {
      const result = snapshot()
      return {
        ...result,
        metrics: { ...result.metrics, missingCount, fileCount, directoryCount, asarPathCount },
        coverage:
          'Observed internalModuleStat calls; ASAR path calls can be served by Electron caches. Does not count package.json reads or physical disk/archive accesses.',
        nodeVersion: realm.process.versions.node,
        electronVersion: realm.process.versions.electron || null,
      }
    },
    dispose,
  }
}
