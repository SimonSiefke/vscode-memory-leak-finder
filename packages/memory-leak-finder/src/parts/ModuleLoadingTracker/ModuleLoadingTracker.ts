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

  let module: any
  try {
    module = builtin('node:module')
  } catch (error) {
    return unavailable(String(error))
  }
  const initial = new Set(Object.keys(module._cache || {}))
  if (
    !patch(
      module,
      '_load',
      (original) =>
        function (this: any, ...args: any[]) {
          return observe(JSON.stringify([args[0], args[1]?.filename || '<root>']), () => Reflect.apply(original, this, args))
        },
    )
  )
    return unavailable('CommonJS module loading instrumentation is unavailable')
  return {
    snapshot: () => {
      const result = snapshot()
      const loadedModules = Object.keys(module._cache || {})
        .filter((path) => !initial.has(path))
        .sort()
      return {
        ...result,
        metrics: { ...result.metrics, newlyCachedModuleCount: loadedModules.length },
        loadedModules,
        coverage:
          'CommonJS load requests, including cached requests; inclusive time includes dependencies, exclusive time subtracts nested load requests. Newly cached modules are those still cached at stop. ESM loading is unavailable.',
      }
    },
    dispose,
  }
}
