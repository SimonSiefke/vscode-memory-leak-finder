import { expect, test } from '@jest/globals'
import { runInNewContext } from 'node:vm'
import { install } from '../src/parts/ModuleLoadingTracker/ModuleLoadingTracker.ts'
const make = (module: any, binding: any = {}) => {
  let time = 0n
  return runInNewContext(`(${install.toString()})()`, {
    process: {
      getBuiltinModule: () => module,
      binding: () => binding,
      cwd: () => '/tmp',
      hrtime: { bigint: () => (time += 1000000n) },
      versions: { node: 'test' },
    },
  })
}
test('observes calls without changing results and restores instrumentation', () => {
  const original = function (request: string) {
    if (request === 'missing') throw new Error('missing')
    module._cache['/a.js'] = {}
    return 'loaded'
  }
  const module: any = { _cache: {}, _load: original }
  const tracker = make(module)
  expect(module._load('a', { filename: '/parent.js' })).toBe('loaded')
  expect(() => module._load('missing')).toThrow('missing')
  expect(tracker.snapshot().metrics).toMatchObject({ count: 2, failureCount: 1, newlyCachedModuleCount: 1 })
  tracker.dispose()
  expect(module._load).toBe(original)
})
test('unsupported runtime is unavailable', () => {
  const tracker = runInNewContext(`(${install.toString()})()`, {})
  expect(tracker.snapshot().available).toBe(false)
  tracker.dispose()
})
