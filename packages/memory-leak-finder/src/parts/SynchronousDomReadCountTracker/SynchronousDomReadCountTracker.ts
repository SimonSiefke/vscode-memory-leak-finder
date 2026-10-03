// Serialized into a separate realm; coverage counters would reference the host scope.
/* istanbul ignore next */
export const install = () => {
  'use strict'
  const realm = globalThis as any
  const captureStacks = false
  const rows = new Map<string, { name: string; count: number }>()
  const apiCounts: Record<string, number> = Object.create(null)
  const unsupportedApis: string[] = []
  const restorers: (() => void)[] = []
  let count = 0,
    overflowCount = 0
  const record = (api: string) => {
    count++
    apiCounts[api] = (apiCounts[api] || 0) + 1
    const stack = captureStacks ? new Error().stack?.split('\n').slice(3).join('\n') || '<unknown>' : ''
    const name = stack ? `${api}\n${stack}` : api
    const row = rows.get(name)
    if (row) row.count++
    else if (rows.size < 1000) rows.set(name, { name, count: 1 })
    else overflowCount++
  }
  const patch = (owner: any, property: string, label: string, kind: 'get' | 'value') => {
    let target = owner
    while (target && !Object.hasOwn(target, property)) target = Object.getPrototypeOf(target)
    const descriptor = target && Object.getOwnPropertyDescriptor(target, property)
    const original = descriptor?.[kind]
    if (typeof original !== 'function' || (!descriptor.configurable && (kind === 'get' || !descriptor.writable))) {
      unsupportedApis.push(label)
      return
    }
    const wrapped = function (this: any, ...args: any[]) {
      // Forward before recording so failed native receiver checks retain their behavior.
      const value = Reflect.apply(original, this, args)
      record(label)
      return value
    }
    Object.defineProperty(target, property, { ...descriptor, [kind]: wrapped })
    restorers.push(() => {
      if (Object.getOwnPropertyDescriptor(target, property)?.[kind] === wrapped) Object.defineProperty(target, property, descriptor)
    })
  }
  try {
    for (const property of ['offsetWidth', 'offsetHeight', 'offsetTop', 'offsetLeft'])
      patch(realm.HTMLElement?.prototype, property, `HTMLElement.${property}`, 'get')
    for (const property of [
      'clientWidth',
      'clientHeight',
      'clientTop',
      'clientLeft',
      'scrollWidth',
      'scrollHeight',
      'scrollTop',
      'scrollLeft',
    ])
      patch(realm.Element?.prototype, property, `Element.${property}`, 'get')
    for (const type of ['Element', 'Range'])
      for (const method of ['getBoundingClientRect', 'getClientRects']) patch(realm[type]?.prototype, method, `${type}.${method}`, 'value')
    patch(realm, 'getComputedStyle', 'window.getComputedStyle', 'value')
  } catch (error) {
    for (const restore of restorers.reverse()) restore()
    throw error
  }
  return {
    snapshot: () => ({
      available: restorers.length > 0,
      reason: restorers.length ? undefined : 'No supported DOM APIs in this context',
      metrics: { count, overflowCount },
      apiCounts,
      unsupportedApis,
      captureStacks,
      rows: [...rows.values()].sort((a, b) => b.count - a.count),
      coverage:
        'Successful calls to covered APIs in the selected execution context, including reads that do not trigger layout; captured references and other frames are not covered',
    }),
    dispose: () => {
      for (const restore of restorers.reverse()) restore()
      restorers.length = 0
    },
  }
}
