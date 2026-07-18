import { expect, test } from '@jest/globals'
import { runInNewContext } from 'node:vm'
import { transformCode } from '../src/parts/Transform/Transform.js'
import { transformCodeWithEverythingTracking } from '../src/parts/TransformCodeWithEverythingTracking/TransformCodeWithEverythingTracking.js'

const run = async (code: string) => {
  const transformed = await transformCode(code, { scriptId: 7, trackingMode: 'everything' })
  const context = { Date, Set, Uint32Array, WeakSet }
  runInNewContext(transformed, context)
  const metadata = (context as any).__vscodeMemoryLeakFinderGetTrackedEverythingMetadata()
  const events = Array.from({ length: metadata.chunkCount }, (_, index) =>
    (context as any).__vscodeMemoryLeakFinderGetTrackedEverythingChunk(index),
  ).flat()
  return { context: context as any, events, metadata, transformed }
}

test('tracks primitive evaluations and explicit identities in source order', async () => {
  const { events, metadata } = await run(`
    const number = 1 + 2
    const string = \`value-\${number}\`
    const array = []
    const object = {}
    globalThis.result = [number, string, array, object]
  `)
  const types = events.map((event: number) => metadata.sites[event].type)
  expect(types).toEqual([
    'Number',
    'Number',
    'Number',
    'String',
    'Array',
    'Object',
    'Array',
  ])
})

test('counts repeated primitive call results but only first observes an object identity', async () => {
  const { events, metadata } = await run(`
    const object = {}
    const returnObject = () => object
    const returnNumber = () => 1
    returnObject()
    returnObject()
    returnNumber()
    returnNumber()
  `)
  const types = events.map((event: number) => metadata.sites[event].type)
  expect(types.filter((type: string) => type === 'Object')).toHaveLength(1)
  expect(types.filter((type: string) => type === 'Number')).toHaveLength(4)
  expect(events).toHaveLength(metadata.eventCount)
  expect(metadata.sites.some((site: any) => site.type === 'Number')).toBe(true)
})

test('preserves directives, object keys, direct eval, optional calls, and results', async () => {
  const { context, transformed } = await run(`
    "use strict"
    const value = { answer: 40 }
    const fn = (amount) => amount + 2
    globalThis.result = [eval('value.answer'), fn?.(40)]
  `)
  expect(context.result).toEqual([40, 42])
  expect(transformed).toContain('"use strict"')
  expect(transformed).toContain('answer:')
})

test('records function and class declarations and method creation', async () => {
  const { events, metadata } = await run(`
    function fn() {}
    class Example { method() {} }
    const instance = new Example()
    const object = { method() {} }
  `)
  const types = events.map((event: number) => metadata.sites[event].type)
  expect(types.filter((type: string) => type === 'Function')).toHaveLength(3)
  expect(types).toContain('Class')
  expect(types).toContain('Example')
  expect(types).toContain('Object')
})

test('uses fixed-size chunks without dropping events', async () => {
  const { context } = await run(`globalThis.record = () => 1`)
  for (let index = 0; index < 65_540; index++) {
    context.record()
  }
  const metadata = context.__vscodeMemoryLeakFinderGetTrackedEverythingMetadata()
  const total = Array.from({ length: metadata.chunkCount }, (_, index) =>
    context.__vscodeMemoryLeakFinderGetTrackedEverythingChunk(index),
  ).reduce((sum: number, chunk: readonly number[]) => sum + chunk.length, 0)
  expect(total).toBe(metadata.eventCount)
  expect(metadata.chunkCount).toBeGreaterThan(1)
  expect(metadata.timeMarks.length).toBeGreaterThan(60)
})

test('empty input stays empty', () => {
  expect(transformCodeWithEverythingTracking('')).toBe('')
})
