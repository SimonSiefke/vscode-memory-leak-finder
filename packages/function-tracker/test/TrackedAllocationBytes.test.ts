import { expect, test } from '@jest/globals'
import { createContext, runInContext } from 'node:vm'
import { allocationBytesPreamble } from '../src/parts/AllocationBytesPreamble/AllocationBytesPreamble.ts'
import { transformCode } from '../src/parts/Transform/Transform.ts'

test('shallow estimates keep nested allocations separate and preserve computed values', async () => {
  const context = createContext({})
  const code = await transformCode(
    `
    globalThis.value = [{ start: 0, end: 0 }]
    globalThis.text = 'abc' + String(12)
    globalThis.fraction = 1 / 2
    globalThis.integer = 1 + 2
  `,
    { trackingMode: 'allocation-bytes', scriptId: 'fixture.js' },
  )
  runInContext(code, context)
  const rows = Object.values(context.getAllocationByteStatistics()) as any[]
  expect(context.value).toEqual([{ start: 0, end: 0 }])
  expect(context.text).toBe('abc12')
  expect(context.fraction).toBe(0.5)
  expect(context.integer).toBe(3)
  expect(rows.filter((row) => row.type === 'Object')).toEqual([expect.objectContaining({ createdCount: 1, estimatedBytes: 20 })])
  expect(rows.filter((row) => row.type === 'Array')).toEqual([expect.objectContaining({ createdCount: 1, estimatedBytes: 28 })])
  expect(
    rows
      .filter((row) => row.type === 'string')
      .map((row) => row.estimatedBytes)
      .sort(),
  ).toEqual([16, 24])
  expect(
    rows
      .filter((row) => row.type === 'number')
      .map((row) => row.estimatedBytes)
      .sort(),
  ).toEqual([0, 12])
  expect(rows.every((row) => row.location.startsWith('fixture.js:') && row.unknownCount === 0)).toBe(true)
})

test('numeric model treats tagged integers as zero and heap number candidates separately', () => {
  const context = createContext({})
  runInContext(allocationBytesPreamble, context)
  for (const value of [0, 42, -1073741824, 1073741823, 0.5, -0, NaN, Infinity, 1073741824]) {
    expect(Object.is(context.trackAllocationBytes(value, 1, 1, 0, 'Computed'), value)).toBe(true)
  }
  const [row] = Object.values(context.getAllocationByteStatistics()) as any[]
  expect(row).toMatchObject({ createdCount: 9, estimatedBytes: 60, unknownCount: 0, type: 'number' })
})

test('collection estimates use intrinsic sizes without running user getters or iterators', () => {
  const context = createContext({})
  runInContext(allocationBytesPreamble, context)
  runInContext(
    `
    const map = new Map([[1, 2], [3, 4]])
    Object.defineProperty(map, 'size', { get() { throw new Error('getter') } })
    map[Symbol.iterator] = () => { throw new Error('iterator') }
    trackAllocationBytes(map, 1, 1, 0, 'Map')
    trackAllocationBytes(new Set([1, 2]), 1, 2, 0, 'Set')
    trackAllocationBytes(new WeakMap(), 1, 3, 0, 'WeakMap')
    trackAllocationBytes(new WeakSet(), 1, 4, 0, 'WeakSet')
    trackAllocationBytes(new WeakRef({}), 1, 5, 0, 'WeakRef')
    trackAllocationBytes(new ArrayBuffer(32), 1, 6, 0, 'ArrayBuffer')
    trackAllocationBytes(new Uint8Array(32), 1, 7, 0, 'Uint8Array')
  `,
    context,
  )
  expect(Object.values(context.getAllocationByteStatistics()).map((row: any) => row.estimatedBytes)).toEqual([80, 56, 32, 32, 16, 64, 64])
})

test('unknown sizes and revoked proxies are reported without changing returned values', () => {
  const context = createContext({})
  runInContext(allocationBytesPreamble, context)
  const { proxy, revoke } = Proxy.revocable({}, {})
  revoke()
  expect(context.trackAllocationBytes(proxy, 1, 1, 0, 'Custom')).toBe(proxy)
  const fn = () => {}
  expect(context.trackAllocationBytes(fn, 1, 2, 0, 'Custom')).toBe(fn)
  expect(Object.values(context.getAllocationByteStatistics())).toEqual([
    expect.objectContaining({ estimatedBytes: 0, unknownCount: 1 }),
    expect.objectContaining({ estimatedBytes: 0, unknownCount: 1 }),
  ])
})

test('byte tracking never invokes ordinary property getters or retains tracked values', () => {
  const context = createContext({})
  runInContext(allocationBytesPreamble, context)
  const value = Object.defineProperty({}, 'value', {
    get() {
      throw new Error('getter must not run')
    },
  })
  expect(context.trackAllocationBytes(value, 1, 1, 0, 'Object')).toBe(value)
  const statistics = context.getAllocationByteStatistics()
  expect(statistics['1:1:0:Object']).toEqual({ createdCount: 1, estimatedBytes: 16, unknownCount: 0, location: '1:1:0', type: 'Object' })
  statistics['1:1:0:Object'].estimatedBytes = 1000
  expect(context.getAllocationByteStatistics()['1:1:0:Object'].estimatedBytes).toBe(16)
  context.resetAllocationByteStatistics()
  expect(context.getAllocationByteStatistics()).toEqual({})
})

test('module preambles preserve counters and leave the count-only mode independent', async () => {
  const context = createContext({})
  const code = await transformCode('globalThis.value = {}', { trackingMode: 'allocation-bytes' })
  runInContext(code, context)
  runInContext(code, context)
  expect(Object.values(context.getAllocationByteStatistics())).toEqual([expect.objectContaining({ createdCount: 2, estimatedBytes: 24 })])
  const countCode = await transformCode('globalThis.other = {}', { trackingMode: 'allocations' })
  expect(countCode).not.toContain('trackAllocationBytes')
})

test('compound assignment, template tags, side effects, and shadowed factories preserve semantics', async () => {
  const context = createContext({})
  const source = `
    let calls = 0
    const receiver = { value: 'a' }
    const getReceiver = () => { calls++; return receiver }
    globalThis.assigned = getReceiver().value += 'b'
    globalThis.template = \`value:\${calls}\`
    const tag = (strings, value) => strings.raw[0] + value
    globalThis.tagged = tag\`value:\${calls}\`
    const String = value => ({ value })
    globalThis.shadowed = String(42)
    globalThis.calls = calls
    globalThis.literal = 'constant'
  `
  const code = await transformCode(source, { trackingMode: 'allocation-bytes' })
  runInContext(code, context)
  expect(context.assigned).toBe('ab')
  expect(context.template).toBe('value:1')
  expect(context.tagged).toBe('value:1')
  expect(context.shadowed).toEqual({ value: 42 })
  expect(context.calls).toBe(1)
})

test('existing byte tracker calls are not instrumented twice', async () => {
  const code = await transformCode(`globalThis.value = trackAllocationBytes({}, 1, 1, 0, 'Object')`, { trackingMode: 'allocation-bytes' })
  const context = createContext({})
  runInContext(code, context)
  expect(Object.values(context.getAllocationByteStatistics())).toEqual([expect.objectContaining({ createdCount: 1 })])
})

test('boxed primitives, UTF-16 strings, bigints, sparse arrays and special constructors use documented estimates', async () => {
  const context = createContext({})
  const code = await transformCode(
    `
    globalThis.text = String('🌍')
    globalThis.big = BigInt('18446744073709551616')
    globalThis.boxedString = new String('abc')
    globalThis.boxedNumber = new Number(0.5)
    globalThis.date = new Date()
    globalThis.regex = /abc/g
    globalThis.sparse = [, ,]
  `,
    { trackingMode: 'allocation-bytes' },
  )
  runInContext(code, context)
  const rows = Object.values(context.getAllocationByteStatistics()) as any[]
  expect(rows.map((row) => [row.type, row.estimatedBytes])).toEqual([
    ['string', 16],
    ['bigint', 32],
    ['String', 36],
    ['Number', 28],
    ['Date', 16],
    ['RegExp', 24],
    ['Array', 32],
  ])
  expect(context.text).toBe('🌍')
  expect(context.boxedString.valueOf()).toBe('abc')
  expect(context.boxedNumber.valueOf()).toBe(0.5)
})
