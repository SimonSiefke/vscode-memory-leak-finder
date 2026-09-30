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

  let fs: any
  try {
    fs = builtin('node:fs')
  } catch (error) {
    return unavailable(String(error))
  }
  const unsupportedApis: string[] = []
  const apis = [
    'readFileSync',
    'statSync',
    'lstatSync',
    'fstatSync',
    'readdirSync',
    'readlinkSync',
    'realpathSync',
    'accessSync',
    'existsSync',
    'openSync',
    'readSync',
    'closeSync',
  ]
  for (const api of apis) {
    const instrument = (original: Function) =>
      function (this: any, ...args: any[]) {
        const path = typeof args[0] === 'string' || typeof args[0] === 'number' ? String(args[0]) : '<non-string path>'
        const caller = new Error().stack?.split('\n').slice(2, 7).join('\n') || '<unknown>'
        return observe(`${api} ${path}\n${caller}`, () => Reflect.apply(original, this, args))
      }
    // realpathSync.native is itself a separate public function.
    if (api === 'realpathSync' && fs[api]?.native) patch(fs[api], 'native', instrument)
    if (
      !patch(fs, api, (original) => {
        const wrapped = instrument(original)
        Object.defineProperties(
          wrapped,
          Object.fromEntries(
            Object.entries(Object.getOwnPropertyDescriptors(original)).filter(
              ([key]) => !['name', 'length', 'prototype', 'arguments', 'caller'].includes(key),
            ),
          ),
        )
        return wrapped
      })
    )
      unsupportedApis.push(api)
  }
  return {
    snapshot: () => ({
      ...snapshot(),
      unsupportedApis,
      coverage:
        'Public fs synchronous APIs accessed through the patched exports; previously captured references and internal Node loader I/O may bypass wrappers. Caller stacks add overhead.',
    }),
    dispose,
  }
}
