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
  expect(types).toEqual(['Number', 'Number', 'Number', 'String', 'Array', 'Object', 'Array'])
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
    class Example { constructor() {} method() {} }
    const instance = new Example()
    const object = { method() {} }
  `)
  const types = events.map((event: number) => metadata.sites[event].type)
  expect(types.filter((type: string) => type === 'Function')).toHaveLength(4)
  expect(types).toContain('Class')
  expect(types).toContain('Example')
  expect(types).toContain('Object')
  expect(metadata.sites.every((site: any) => !site.location.includes(':-1:-1'))).toBe(true)
})

test('does not instrument generated declaration metadata', () => {
  const transformed = transformCodeWithEverythingTracking(`export function fn() {}\nexport class Example { method() {} }`, { scriptId: 7 })
  expect(transformed).not.toContain('__vscodeMemoryLeakFinderTrackEverything(7, 7')
  expect(transformed.match(/__vscodeMemoryLeakFinderTrackEverything/g)).toHaveLength(2)
})

test('counts anonymous default function and class declarations without renaming them', () => {
  const functionCode = transformCodeWithEverythingTracking(`export default function () {}`, { scriptId: 7 })
  const classCode = transformCodeWithEverythingTracking(`export default class { method() {} }`, { scriptId: 7 })
  expect(functionCode).toContain('export default function () {}')
  expect(functionCode).toContain('__vscodeMemoryLeakFinderTrackEverything(void 0, 7')
  expect(classCode).toContain('export default class {')
  expect(classCode).toContain('__vscodeMemoryLeakFinderTrackEverything(void 0, 7')
})

test('preserves tagged templates, inheritance, and super calls', async () => {
  const { context } = await run(`
    const tag = (parts, value) => parts[0] + value
    class Base { constructor() { this.value = 2 } }
    class Child extends Base { constructor() { super() } }
    const child = new Child()
    globalThis.result = tag\`value-\${child.value}\`
  `)
  expect(context.result).toBe('value-2')
})

test('tracks rest parameter arrays for functions, arrows, and methods', async () => {
  const { context, events, metadata } = await run(`
    function declared(...values) { return values.length }
    const arrow = (...values) => values.length
    const object = { method(...values) { return values.length } }
    globalThis.result = [declared(1), arrow(1, 2), object.method(1, 2, 3)]
  `)
  expect(context.result).toEqual([1, 2, 3])
  const types = events.map((event: number) => metadata.sites[event].type)
  expect(types.filter((type: string) => type === 'Array').length).toBeGreaterThanOrEqual(4)
})

test('tracks array and object values created by destructuring rest', async () => {
  const { context, events, metadata } = await run(`
    const sourceObject = { keep: 1, value: 2 }
    const sourceArray = [1, 2, 3]
    const { keep, ...objectRest } = sourceObject
    const [first, ...arrayRest] = sourceArray
    const read = ({ keep, ...parameterRest }) => parameterRest.value
    globalThis.result = [objectRest.value, arrayRest.length, read(sourceObject)]
  `)
  expect(context.result).toEqual([2, 2, 2])
  const types = events.map((event: number) => metadata.sites[event].type)
  expect(types.filter((type: string) => type === 'Object').length).toBeGreaterThanOrEqual(3)
  expect(types.filter((type: string) => type === 'Array').length).toBeGreaterThanOrEqual(3)
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
