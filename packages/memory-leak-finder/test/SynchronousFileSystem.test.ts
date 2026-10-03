import { runInNewContext } from 'node:vm'
import { expect, test } from '@jest/globals'
import { install } from '../src/parts/SynchronousFileSystemTracker/SynchronousFileSystemTracker.ts'
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
  const original = function (path: string) {
    if (path === 'missing') throw new Error('missing')
    return 'content'
  }
  const fs = { readFileSync: original }
  const tracker = make(fs)
  expect(fs.readFileSync('/a')).toBe('content')
  expect(() => fs.readFileSync('missing')).toThrow('missing')
  expect(tracker.snapshot().metrics).toMatchObject({ count: 2, failureCount: 1 })
  expect(tracker.snapshot().unsupportedApis).toContain('statSync')
  tracker.dispose()
  expect(fs.readFileSync).toBe(original)
})
test('unsupported runtime is unavailable', () => {
  const tracker = runInNewContext(`(${install.toString()})()`, {})
  expect(tracker.snapshot().available).toBe(false)
  tracker.dispose()
})
