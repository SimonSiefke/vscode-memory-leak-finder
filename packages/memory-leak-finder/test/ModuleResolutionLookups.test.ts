import { expect, test } from '@jest/globals'
import { runInNewContext } from 'node:vm'
import { install } from '../src/parts/ModuleResolutionLookupsTracker/ModuleResolutionLookupsTracker.ts'
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
  const binding = { internalModuleStat: (path: string) => (path.endsWith('missing') ? -2 : 0) }
  const module = { createRequire: () => ({ resolve: () => binding.internalModuleStat('probe-missing') }) }
  const original = binding.internalModuleStat
  const tracker = make(module, binding)
  binding.internalModuleStat('/app.asar/a.js')
  binding.internalModuleStat('/missing')
  expect(tracker.snapshot().metrics).toMatchObject({ count: 2, missingCount: 1, fileCount: 1, asarPathCount: 1 })
  tracker.dispose()
  expect(binding.internalModuleStat).toBe(original)
})
test('unsupported runtime is unavailable', () => {
  const tracker = runInNewContext(`(${install.toString()})()`, {})
  expect(tracker.snapshot().available).toBe(false)
  tracker.dispose()
})
