import { expect, test } from '@jest/globals'
import { execFile } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import * as GetMeasure from '../src/parts/GetMeasure/GetMeasure.ts'
import * as MeasureHeapUsage from '../src/parts/MeasureHeapUsage/MeasureHeapUsage.ts'
import * as Measures from '../src/parts/Measures/Measures.ts'

const execFileAsync = promisify(execFile)
const fixturePath = fileURLToPath(new URL('./fixtures/heap-usage-backing-store.mjs', import.meta.url))

const nodeHeap = {
  heapSpaces: [
    { physical_space_size: 100, space_name: 'new_space', space_size: 200, space_used_size: 50 },
    { space_name: 'malformed', space_size: 'x' },
    { space_size: 1 },
  ],
  heapStatistics: {
    external_memory: 10,
    malloced_memory: 20,
    number_of_detached_contexts: 1,
    number_of_native_contexts: 2,
    peak_malloced_memory: 30,
    total_global_handles_size: 40,
    total_physical_size: 50,
    used_global_handles_size: 60,
  },
}

const createSession = (evaluate: () => unknown) => {
  const calls: string[] = []
  const session = {
    dispose() {},
    async invoke(method: string) {
      calls.push(method)
      switch (method) {
        case 'Runtime.getHeapUsage':
          return {
            result: { backingStorageSize: 3_000, embedderHeapUsedSize: 2_000, totalSize: 4_000, usedSize: 1_000 },
          }
        case 'Runtime.evaluate':
          return evaluate()
        default:
          throw new Error(`unexpected method ${method}`)
      }
    },
  }
  return { calls, session }
}

const measure = async (session: any) => {
  const args = MeasureHeapUsage.create(session) as [any]
  const before = await MeasureHeapUsage.start(...args)
  const after = await MeasureHeapUsage.stop(...args)
  return MeasureHeapUsage.compare(before, after)
}

test('heap-usage resolves to the heap usage measure', () => {
  expect(GetMeasure.getMeasure({ Measures }, 'heap-usage')).toBe(MeasureHeapUsage)
})

test('heap-usage keeps node statistics evaluation outside the measured heap interval', async () => {
  const { calls, session } = createSession(() => ({ result: { result: { type: 'object', value: nodeHeap } } }))
  const result = await measure(session)
  expect(calls).toEqual(['Runtime.evaluate', 'Runtime.getHeapUsage', 'Runtime.getHeapUsage', 'Runtime.evaluate'])
  expect(result.bytes.backingStorageSize).toEqual({ after: 3_000, before: 3_000, delta: 0 })
  expect(result.node?.after.heapStatistics).toEqual(nodeHeap.heapStatistics)
  expect(result.node?.after.heapSpaces).toEqual([
    { physical_space_size: 100, space_name: 'new_space', space_size: 200, space_used_size: 50 },
    { physical_space_size: null, space_name: 'malformed', space_size: null, space_used_size: null },
  ])
})

test('heap-usage reports node as null for browser-like targets', async () => {
  const { session } = createSession(() => ({ result: { result: { subtype: 'null', type: 'object', value: null } } }))
  const result = await measure(session)
  expect(result.node).toBeNull()
  expect(result.usedAfter).toBe('1 kB')
  expect(result.bytes.embedderHeapUsedSize).toEqual({ after: 2_000, before: 2_000, delta: 0 })
})

test('heap-usage reports node as null when evaluation fails', async () => {
  const { session } = createSession(() => {
    throw new Error('Execution context was destroyed')
  })
  const result = await measure(session)
  expect(result.node).toBeNull()
  expect(result.usedBefore).toBe('1 kB')
})

test('heap-usage reports node as null when evaluation throws in the target', async () => {
  const { session } = createSession(() => ({
    result: { exceptionDetails: { exception: { description: 'ReferenceError' } }, result: { type: 'object' } },
  }))
  const result = await measure(session)
  expect(result.node).toBeNull()
})

const linuxOrMacTest = process.platform === 'win32' ? test.skip : test

linuxOrMacTest(
  'heap-usage reports a retained ArrayBuffer as backing storage in a real V8 isolate',
  async () => {
    const { stdout } = await execFileAsync(process.execPath, [fixturePath], {
      env: { ...process.env, FORCE_COLOR: '0' },
      timeout: 20_000,
    })
    const result = JSON.parse(stdout)
    expect(result.bytes.backingStorageSize.delta).toBeGreaterThanOrEqual(31 * 1024 * 1024)
    expect(Math.abs(result.bytes.usedSize.delta)).toBeLessThan(4 * 1024 * 1024)
    expect(result.bytes.embedderHeapUsedSize.after).toEqual(expect.any(Number))
    expect(result.node.after.heapStatistics.number_of_native_contexts).toBeGreaterThanOrEqual(1)
    expect(result.node.after.heapStatistics.external_memory - result.node.before.heapStatistics.external_memory).toBeGreaterThanOrEqual(
      31 * 1024 * 1024,
    )
    expect(result.node.after.heapSpaces.map((space: { space_name: string }) => space.space_name)).toContain('old_space')
  },
  25_000,
)
