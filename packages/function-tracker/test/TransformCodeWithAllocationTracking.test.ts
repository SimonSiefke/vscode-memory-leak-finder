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

test('TransformCodeWithAllocationTracking - uses filename as stable allocation identifier', () => {
  const code = `const value = {}`

  const transformed = transformCodeWithAllocationTracking(code, { filename: '/tmp/vscode/out/vs/editor/editor.main.js' })

  expect(transformed).toBe(`const value = trackAllocation({}, "/tmp/vscode/out/vs/editor/editor.main.js", 1, 14, "Object");`)
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

test('TransformCodeWithAllocationTracking - should record allocation run deltas', async () => {
  const code = `
    globalThis.createValue = () => ({ ok: true })
  `

  const transformed = await transformCode(code, { scriptId: 7, trackingMode: 'allocations' })
  const context = { WeakRef }
  runInNewContext(transformed, context)

  ;(context as any).createValue()
  ;(context as any).markAllocationRun()
  ;(context as any).createValue()
  ;(context as any).createValue()
  ;(context as any).markAllocationRun()
  ;(context as any).markAllocationRun()

  expect((context as any).getAllocationRuns()).toEqual([
    {
      allocations: [
        {
          createdCount: 1,
          location: '7:2:36',
          type: 'Object',
        },
      ],
      runIndex: 0,
    },
    {
      allocations: [
        {
          createdCount: 2,
          location: '7:2:36',
          type: 'Object',
        },
      ],
      runIndex: 1,
    },
    {
      allocations: [],
      runIndex: 2,
    },
  ])

  ;(context as any).resetAllocationStatistics()

  expect((context as any).getAllocationRuns()).toEqual([])
})

test('TransformCodeWithAllocationTracking - should aggregate allocation stack traces when enabled', async () => {
  const code = `
    globalThis.createValue = () => ({ ok: true })
  `

  const transformed = await transformCode(code, { scriptId: 7, trackingMode: 'allocations' })
  const context = { Error, WeakRef }
  runInNewContext(transformed, context)

  ;(context as any).setAllocationStackTrackingEnabled(true)
  for (let i = 0; i < 2; i++) {
    ;(context as any).createValue()
  }

  expect((context as any).getAllocationStackStatistics()).toEqual([
    expect.objectContaining({
      createdCount: 2,
      location: '7:2:36',
      stack: expect.stringContaining('createValue'),
      type: 'Object',
    }),
  ])

  ;(context as any).setAllocationStackTrackingEnabled(false)
  ;(context as any).createValue()

  expect((context as any).getAllocationStackStatistics()).toEqual([
    expect.objectContaining({
      createdCount: 2,
    }),
  ])

  ;(context as any).resetAllocationStatistics()
  expect((context as any).getAllocationStackStatistics()).toEqual([])
})

test('TransformCodeWithAllocationTracking - should capture stacks only for selected allocation locations', async () => {
  const code = `
    globalThis.createObject = () => ({ ok: true })
    globalThis.createArray = () => []
  `

  const transformed = await transformCode(code, { scriptId: 7, trackingMode: 'allocations' })
  const context = { Error, WeakRef }
  runInNewContext(transformed, context)

  ;(context as any).setAllocationStackTrackingEnabled(true, ['7:2:37'])
  ;(context as any).createObject()
  ;(context as any).createArray()

  expect((context as any).getAllocationStackStatistics()).toEqual([
    expect.objectContaining({
      createdCount: 1,
      location: '7:2:37',
      type: 'Object',
    }),
  ])
  expect((context as any).getAllocationStatistics()).toEqual({})
})
