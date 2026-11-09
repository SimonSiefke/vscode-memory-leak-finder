import { beforeEach, expect, jest, test } from '@jest/globals'
import { createContext, runInContext } from 'node:vm'
import type { TrackedAllocationByteStatistic } from '../src/parts/GetTrackedAllocationBytes/GetTrackedAllocationBytes.ts'

const evaluate = jest.fn<(session: any, options: any) => Promise<any>>()
const resolve = jest.fn<(...args: any[]) => Promise<any>>()
jest.unstable_mockModule('../src/parts/DevtoolsProtocol/DevtoolsProtocol.ts', () => ({
  DevtoolsProtocolRuntime: { evaluate },
}))
jest.unstable_mockModule('../src/parts/ResolveTrackedLocationSourceMaps/ResolveTrackedLocationSourceMaps.ts', () => ({
  resolveTrackedLocationSourceMaps: resolve,
}))
const Get = await import('../src/parts/GetTrackedAllocationBytes/GetTrackedAllocationBytes.ts')
const Measure = await import('../src/parts/MeasureTrackedAllocationBytes/MeasureTrackedAllocationBytes.ts')
const { compareTrackedAllocationBytes } = await import('../src/parts/CompareTrackedAllocationBytes/CompareTrackedAllocationBytes.ts')

beforeEach(() => {
  jest.clearAllMocks()
  resolve.mockResolvedValue({})
})

const entry = (estimatedBytes: number, createdCount = 1, unknownCount = 0): TrackedAllocationByteStatistic => ({
  createdCount,
  estimatedBytes,
  unknownCount,
  location: '1:2:3',
  type: 'Object',
})

test('byte comparison subtracts snapshots, resolves sources, sorts by bytes, and keeps unknown/zero-byte rows', async () => {
  resolve.mockResolvedValue({
    '1:2:3': {
      originalColumn: 5,
      originalLine: 10,
      originalLocation: 'src/a.ts:10:5',
      originalName: 'Widget',
      originalSource: 'src/a.ts',
    },
  })
  const rows = await compareTrackedAllocationBytes(
    { trackedAllocationBytes: { a: entry(20, 1) } },
    {
      trackedAllocationBytes: {
        a: entry(80, 4),
        b: entry(100, 2),
        c: entry(0, 1, 1),
        d: entry(0),
        unchanged: entry(0, 0),
      },
      scriptMap: {},
    },
  )
  expect(rows.map((row) => [row.estimatedBytes, row.createdCount, row.unknownCount])).toEqual([
    [100, 2, 0],
    [60, 3, 0],
    [0, 1, 1],
    [0, 1, 0],
  ])
  expect(rows[0]).toMatchObject({ originalType: 'Widget', originalLocation: 'src/a.ts:10:5' })
  expect(resolve).toHaveBeenCalledWith(['1:2:3'], {})
  expect(Measure.summary(rows)).toContain('160 B (1 unknown-size values)')
  expect(Measure.summary(rows)).toContain('Widget | src/a.ts:10:5')
  expect(Measure.isLeak()).toBe(false)
})

test('byte comparison handles missing source maps and empty intervals', async () => {
  const rows = await compareTrackedAllocationBytes({ trackedAllocationBytes: {} }, { trackedAllocationBytes: { a: entry(12) } })
  expect(rows[0]).toMatchObject({ originalSource: null, originalLocation: null, originalType: 'Object' })
  expect(await compareTrackedAllocationBytes({ trackedAllocationBytes: {} }, { trackedAllocationBytes: {} })).toEqual([])
  expect(Measure.summary([])).toContain('0 B (0 unknown-size values)')
})

test('byte getter distinguishes a valid empty result from missing instrumentation', async () => {
  for (const value of [null, undefined, 1, []]) {
    evaluate.mockResolvedValueOnce(value)
    await expect(Get.getTrackedAllocationBytes({} as any)).rejects.toThrow('Launch with --measure trackedAllocationBytes')
  }
  evaluate.mockResolvedValueOnce({})
  expect(await Get.getTrackedAllocationBytes({} as any)).toEqual({})
})

test('measure lifecycle resets setup allocations and stops script capture even on failure', async () => {
  const calls: string[] = []
  const handler = {
    scriptMap: {},
    start: jest.fn(async () => {
      calls.push('start')
    }),
    stop: jest.fn(async () => {
      calls.push('stop')
    }),
  }
  evaluate.mockImplementation(async (_session, options) => {
    if (options.expression.includes('resetAllocationByteStatistics')) {
      calls.push('reset')
      return undefined
    }
    calls.push('get')
    return { a: entry(20) }
  })
  expect(await Measure.start({} as any, handler)).toEqual({ trackedAllocationBytes: {} })
  expect(await Measure.stop({} as any, handler)).toEqual({ scriptMap: {}, trackedAllocationBytes: { a: entry(20) } })
  expect(calls).toEqual(['start', 'get', 'reset', 'get', 'stop'])
  evaluate.mockRejectedValueOnce(new Error('disconnected'))
  await expect(Measure.stop({} as any, handler)).rejects.toThrow('disconnected')
  expect(handler.stop).toHaveBeenCalledTimes(2)
  handler.stop.mockRejectedValueOnce(new Error('already stopped'))
  await expect(Measure.releaseResources({} as any, handler)).resolves.toBeUndefined()
  expect(Measure.id).toBe('trackedAllocationBytes')
})

test('measure boundary serializes primitive-only statistics and reset snapshots', async () => {
  const context = createContext({
    getAllocationByteStatistics: () => ({ a: entry(20) }),
    resetAllocationByteStatistics: jest.fn(),
  })
  evaluate.mockImplementation(async (_session, options) => runInContext(options.expression, context))
  expect(await Get.getTrackedAllocationBytes({} as any)).toEqual({ a: entry(20) })
  await Get.resetTrackedAllocationBytes({} as any)
  expect(context.resetAllocationByteStatistics).toHaveBeenCalledTimes(1)
})
