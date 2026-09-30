import { expect, test } from '@jest/globals'
import { runInNewContext } from 'node:vm'
import { install } from '../src/parts/ModuleResolutionTracker/ModuleResolutionTracker.ts'
let disposed = false
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
  let resolve: any
  const module = {
    registerHooks: (hooks: any) => {
      resolve = hooks.resolve
      return {
        deregister() {
          disposed = true
        },
      }
    },
  }
  const tracker = make(module)
  expect(resolve('thing', { parentURL: 'file:///a.js' }, () => 'resolved')).toBe('resolved')
  expect(() =>
    resolve('missing', { parentURL: 'file:///a.js' }, () => {
      throw new Error('missing')
    }),
  ).toThrow('missing')
  expect(tracker.snapshot().metrics).toMatchObject({ count: 2, failureCount: 1 })
  expect(tracker.snapshot().rows).toHaveLength(2)
  tracker.dispose()
  expect(disposed).toBe(true)
})
test('unsupported runtime is unavailable', () => {
  const tracker = runInNewContext(`(${install.toString()})()`, {})
  expect(tracker.snapshot().available).toBe(false)
  tracker.dispose()
})
