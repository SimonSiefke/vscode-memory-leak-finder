import { execFile } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { test, expect } from '@jest/globals'
import * as CompareInstanceCountsDifference from '../src/parts/CompareInstanceCountsDifference/CompareInstanceCountsDifference.ts'

test('compareInstanceCountsDifference', async () => {
  const before = [
    {
      count: 9392,
      name: 'LoaderEvent',
    },
    {
      count: 5561,
      name: 'Node',
    },
    {
      count: 4698,
      name: 'AsyncFunction',
    },
    {
      count: 2560,
      name: 'Module',
    },
    {
      count: 2453,
      name: 'UniqueContainer',
    },
    {
      count: 2389,
      name: 'LinkedList',
    },
    {
      count: 2055,
      name: 'Emitter',
    },
  ]
  const after = [
    {
      count: 9392,
      name: 'LoaderEvent',
    },
    {
      count: 5561,
      name: 'Node',
    },
    {
      count: 4698,
      name: 'AsyncFunction',
    },
    {
      count: 2560,
      name: 'Module',
    },
    {
      count: 2460,
      name: 'UniqueContainer',
    },
    {
      count: 2389,
      name: 'LinkedList',
    },
    {
      count: 2118,
      name: 'Emitter',
    },
  ]
  expect(await CompareInstanceCountsDifference.compareInstanceCountsDifference(before, after)).toEqual([
    {
      count: 2460,
      delta: 7,
      name: 'UniqueContainer',
    },
    {
      count: 2118,
      delta: 63,
      name: 'Emitter',
    },
  ])
})

test('unchanged duplicate constructor names do not report growth', async () => {
  const counts = Object.freeze([Object.freeze({ name: 'Shared', count: 4 }), Object.freeze({ name: 'Shared', count: 2 })])
  expect(await CompareInstanceCountsDifference.compareInstanceCountsDifference(counts, counts)).toEqual([])
})

test('reordering duplicate constructor names does not report growth', async () => {
  const before = [
    { name: 'Shared', count: 4 },
    { name: 'Shared', count: 2 },
  ]
  expect(await CompareInstanceCountsDifference.compareInstanceCountsDifference(before, before.toReversed())).toEqual([])
})

test('reports true aggregate growth once per constructor name', async () => {
  const before = [
    { name: 'Shared', count: 4 },
    { name: 'Shared', count: 2 },
  ]
  const after = [
    { name: 'Shared', count: 5 },
    { name: 'Shared', count: 4 },
  ]
  expect(await CompareInstanceCountsDifference.compareInstanceCountsDifference(before, after)).toEqual([
    { name: 'Shared', count: 9, delta: 3 },
  ])
})

test('decreasing aggregate counts do not report growth', async () => {
  const before = [
    { name: 'Shared', count: 4 },
    { name: 'Shared', count: 2 },
  ]
  const after = [
    { name: 'Shared', count: 2 },
    { name: 'Shared', count: 1 },
  ]
  expect(await CompareInstanceCountsDifference.compareInstanceCountsDifference(before, after)).toEqual([])
})

test('aggregates anonymous and prototype-like names safely', async () => {
  const before = ['', '__proto__'].flatMap((name) => [
    { name, count: 4 },
    { name, count: 2 },
  ])
  const after = ['', '__proto__'].flatMap((name) => [
    { name, count: 5 },
    { name, count: 2 },
  ])
  expect(await CompareInstanceCountsDifference.compareInstanceCountsDifference(before, after)).toEqual([
    { name: '', count: 7, delta: 1 },
    { name: '__proto__', count: 7, delta: 1 },
  ])
})

test('unchanged native inspector constructor counts remain unchanged', async () => {
  const fixture = fileURLToPath(new URL('./fixtures/instance-counts-duplicate-names.mjs', import.meta.url))
  const { stdout } = await promisify(execFile)(process.execPath, [fixture], { timeout: 20000, maxBuffer: 65536 })
  expect(JSON.parse(stdout)).toEqual({ counts: [3, 1], differences: [] })
}, 25000)
