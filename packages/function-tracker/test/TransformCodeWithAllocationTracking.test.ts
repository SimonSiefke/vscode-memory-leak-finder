import { expect, test } from '@jest/globals'
import { runInNewContext } from 'node:vm'
import { transformCode } from '../src/parts/Transform/Transform.js'
import { transformCodeWithAllocationTracking } from '../src/parts/TransformCodeWithAllocationTracking/TransformCodeWithAllocationTracking.js'

test('TransformCodeWithAllocationTracking - should transform allocation expressions', () => {
  const code = `
    const array = []
    const object = {}
    const regex = /abc/g
    const set = new Set()
  `

  const transformed = transformCodeWithAllocationTracking(code, { scriptId: 7 })
  const expected = `const array = trackAllocation([], 7, 2, 18, "Array");
const object = trackAllocation({}, 7, 3, 19, "Object");
const regex = trackAllocation(/abc/g, 7, 4, 18, "RegExp");
const set = trackAllocation(new Set(), 7, 5, 16, "Set");`

  expect(transformed).toBe(expected)
})

test('TransformCodeWithAllocationTracking - should transform known allocation factories', () => {
  const code = `
    const array = Array.from(items)
    const otherArray = Array.of(1, 2)
    const object = Object.create(null)
  `

  const transformed = transformCodeWithAllocationTracking(code, { scriptId: 7 })
  const expected = `const array = trackAllocation(Array.from(items), 7, 2, 18, "Array");
const otherArray = trackAllocation(Array.of(1, 2), 7, 3, 23, "Array");
const object = trackAllocation(Object.create(null), 7, 4, 19, "Object");`

  expect(transformed).toBe(expected)
})

test('TransformCodeWithAllocationTracking - should not double instrument existing trackAllocation calls', () => {
  const code = `const value = trackAllocation([], 1, 2, 3, 'Array')`

  const transformed = transformCodeWithAllocationTracking(code, { scriptId: 7 })

  expect(transformed).toBe(`const value = trackAllocation([], 1, 2, 3, 'Array');`)
})

test('TransformCodeWithAllocationTracking - should preserve expression results', async () => {
  const code = `
    const value = { ok: true }
    globalThis.result = value.ok
  `

  const transformed = await transformCode(code, { scriptId: 7, trackingMode: 'allocations' })
  const context = { WeakRef }
  runInNewContext(transformed, context)

  expect((context as any).result).toBe(true)
  expect((context as any).getAllocationStatistics()).toEqual({
    '7:2:18:Object': {
      aliveCount: 1,
      collectedCount: 0,
      createdCount: 1,
      location: '7:2:18',
      type: 'Object',
    },
  })
})
