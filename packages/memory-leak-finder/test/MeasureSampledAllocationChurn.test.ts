import { expect, test } from '@jest/globals'
import { Session as InspectorSession } from 'node:inspector'
import * as GetMeasure from '../src/parts/GetMeasure/GetMeasure.ts'
import * as MeasureSampledAllocationChurn from '../src/parts/MeasureSampledAllocationChurn/MeasureSampledAllocationChurn.ts'
import * as Measures from '../src/parts/Measures/Measures.ts'
import * as TargetId from '../src/parts/TargetId/TargetId.ts'

const MiB = 1024 * 1024

const selfCheckProfile = {
  head: {
    callFrame: { functionName: '(root)' },
    children: [{ callFrame: { functionName: 'selfCheck', url: '' }, children: [], selfSize: 4 * MiB }],
    selfSize: 0,
  },
  samples: [],
}

const windowProfile = {
  head: {
    callFrame: { functionName: '(root)' },
    children: [
      {
        callFrame: { columnNumber: 2, functionName: 'type', lineNumber: 9, scriptId: '3', url: 'file:///workbench.js' },
        children: [],
        selfSize: 65536,
      },
    ],
    selfSize: 0,
  },
  samples: [{ nodeId: 2, ordinal: 1, size: 64 }],
}

const createSession = (handlers: Record<string, (callIndex: number) => unknown> = {}) => {
  const calls: unknown[] = []
  const counts: Record<string, number> = {}
  const session = {
    dispose() {},
    invoke(method: string, params: unknown) {
      calls.push([method, params])
      const callIndex = counts[method] || 0
      counts[method] = callIndex + 1
      if (handlers[method]) {
        return Promise.resolve(handlers[method](callIndex))
      }
      if (method === 'Runtime.evaluate') {
        return Promise.resolve({ result: { result: { type: 'number', value: 64000 } } })
      }
      if (method === 'HeapProfiler.getSamplingProfile') {
        return Promise.resolve({ result: { profile: callIndex === 0 ? selfCheckProfile : windowProfile } })
      }
      return Promise.resolve({ result: {} })
    },
  } as any
  return { calls, session }
}

const samplingOptions = {
  includeObjectsCollectedByMajorGC: true,
  includeObjectsCollectedByMinorGC: true,
  samplingInterval: 32768,
}

const run = async (session: any) => {
  const args = MeasureSampledAllocationChurn.create(session) as [any, any]
  try {
    const before = await MeasureSampledAllocationChurn.start(...args)
    const after = await MeasureSampledAllocationChurn.stop(...args)
    return MeasureSampledAllocationChurn.compare(before, after)
  } finally {
    await MeasureSampledAllocationChurn.releaseResources(...args)
  }
}

test('sampled-allocation-churn resolves from its CLI name and targets every V8 isolate kind', () => {
  expect(GetMeasure.getMeasure({ Measures }, 'sampled-allocation-churn')).toBe(MeasureSampledAllocationChurn)
  expect(MeasureSampledAllocationChurn.targets).toEqual([TargetId.Browser, TargetId.Node, TargetId.Worker])
})

test('self-checks collected-object sampling, then samples the measured window and cleans up', async () => {
  const { calls, session } = createSession()

  const result = await run(session)

  expect(calls).toEqual([
    ['HeapProfiler.enable', {}],
    ['HeapProfiler.startSampling', samplingOptions],
    ['Runtime.evaluate', { expression: MeasureSampledAllocationChurn.SelfCheckExpression, returnByValue: true }],
    ['HeapProfiler.collectGarbage', {}],
    ['HeapProfiler.getSamplingProfile', {}],
    ['HeapProfiler.stopSampling', {}],
    ['HeapProfiler.startSampling', samplingOptions],
    ['HeapProfiler.getSamplingProfile', {}],
    ['HeapProfiler.stopSampling', {}],
    ['HeapProfiler.disable', {}],
  ])
  expect(result).toEqual({
    isLeak: false,
    metrics: { callFrameCount: 1, sampleCount: 1, sampledAllocatedBytes: 65536 },
    samplingIntervalBytes: 32768,
    supported: true,
    topSelfBytes: [{ columnNumber: 2, functionName: 'type', lineNumber: 9, scriptId: '3', selfBytes: 65536, url: 'file:///workbench.js' }],
    topStacks: [{ selfBytes: 65536, stack: ['type (file:///workbench.js:10:3)'] }],
    unsupportedReason: '',
  })
  expect(MeasureSampledAllocationChurn.isLeak()).toBe(false)
  expect(MeasureSampledAllocationChurn.summary(result)).toContain('65536 | type | file:///workbench.js:10:3')
})

test('reports unsupported when the runtime ignores the collected-object flags', async () => {
  const { calls, session } = createSession({
    'HeapProfiler.getSamplingProfile': () => ({ result: { profile: { head: { children: [], selfSize: 4096 }, samples: [] } } }),
  })

  const result = await run(session)

  expect(result.supported).toBe(false)
  expect(result.unsupportedReason).toBe(
    'HeapProfiler sampling did not retain collected objects: the self-check sampled 4096 bytes, expected at least 1048576',
  )
  expect(result.metrics.sampledAllocatedBytes).toBe(0)
  expect(calls.map((call: any) => call[0])).toEqual([
    'HeapProfiler.enable',
    'HeapProfiler.startSampling',
    'Runtime.evaluate',
    'HeapProfiler.collectGarbage',
    'HeapProfiler.getSamplingProfile',
    'HeapProfiler.stopSampling',
    'HeapProfiler.disable',
  ])
})

test('reports unsupported when the target has no HeapProfiler sampling', async () => {
  const { calls, session } = createSession({
    'HeapProfiler.startSampling': () => ({ error: { code: -32601, message: `'HeapProfiler.startSampling' wasn't found` } }),
  })

  const result = await run(session)

  expect(result.supported).toBe(false)
  expect(result.unsupportedReason).toBe(`HeapProfiler sampling is unavailable: 'HeapProfiler.startSampling' wasn't found`)
  expect(calls.map((call: any) => call[0])).toEqual(['HeapProfiler.enable', 'HeapProfiler.startSampling', 'HeapProfiler.disable'])
})

test('stops sampling and rethrows when the measured profile cannot be read', async () => {
  const { calls, session } = createSession({
    'HeapProfiler.getSamplingProfile': (callIndex) =>
      callIndex === 0 ? { result: { profile: selfCheckProfile } } : { error: { code: -32602, message: 'Invalid parameters' } },
  })

  await expect(run(session)).rejects.toThrow('Invalid parameters')

  expect(calls.slice(-3).map((call: any) => call[0])).toEqual([
    'HeapProfiler.getSamplingProfile',
    'HeapProfiler.stopSampling',
    'HeapProfiler.disable',
  ])
})

test('reports unavailable data when sampling was stopped by another client during the window', async () => {
  const notStarted = { error: { code: -32000, message: 'V8 sampling heap profiler was not started' } }
  const { session } = createSession({
    'HeapProfiler.getSamplingProfile': (callIndex) => (callIndex === 0 ? { result: { profile: selfCheckProfile } } : notStarted),
    'HeapProfiler.stopSampling': (callIndex) => (callIndex === 0 ? { result: {} } : notStarted),
  })

  const result = await run(session)

  expect(result.supported).toBe(false)
  expect(result.unsupportedReason).toBe('HeapProfiler sampling profile is unavailable: V8 sampling heap profiler was not started')
})

test('releaseResources stops an active sampler once and tolerates a closed or missing profiler', async () => {
  const { calls, session } = createSession({
    'HeapProfiler.disable': () => ({ error: { code: -32601, message: `'HeapProfiler.disable' wasn't found` } }),
  })
  const args = MeasureSampledAllocationChurn.create(session) as [any, any]

  await MeasureSampledAllocationChurn.start(...args)
  await MeasureSampledAllocationChurn.releaseResources(...args)
  await MeasureSampledAllocationChurn.releaseResources(...args)

  expect(calls.slice(-2).map((call: any) => call[0])).toEqual(['HeapProfiler.stopSampling', 'HeapProfiler.disable'])
})

// The adapter connects to the V8 isolate that runs this test. It validates the sampling flags on the test Node's V8
// only; the live VS Code smoke test covers Electron.
const createInProcessSession = () => {
  const inspectorSession = new InspectorSession()
  inspectorSession.connect()
  const session = {
    dispose() {
      inspectorSession.disconnect()
    },
    invoke(method: string, params: object) {
      return new Promise((resolve) => {
        inspectorSession.post(method, params, (error: any, result: unknown) => {
          if (!error) {
            resolve({ result })
            return
          }
          const match = /^Inspector error (-?\d+): (.*)$/s.exec(error.message)
          resolve({ error: match ? { code: Number(match[1]), message: match[2] } : { code: -32603, message: error.message } })
        })
      })
    },
  } as any
  return session
}

const sink: { value: unknown } = { value: undefined }

const allocateShortLivedDoubleArrays = (count: number) => {
  for (let index = 0; index < count; index++) {
    // 1024 doubles are 8 KiB per array on every V8 build, with or without pointer compression.
    sink.value = new Array(1024).fill(index + 0.5)
  }
  sink.value = undefined
}

const measureInProcess = async (action: () => void) => {
  const session = createInProcessSession()
  const args = MeasureSampledAllocationChurn.create(session) as [any, any]
  try {
    const before = await MeasureSampledAllocationChurn.start(...args)
    action()
    await session.invoke('HeapProfiler.collectGarbage', {})
    const after = await MeasureSampledAllocationChurn.stop(...args)
    return MeasureSampledAllocationChurn.compare(before, after)
  } finally {
    await MeasureSampledAllocationChurn.releaseResources(...args)
    session.dispose()
  }
}

test('real Node V8 attributes collected short-lived allocations to the allocating function', async () => {
  const churn = await measureInProcess(() => allocateShortLivedDoubleArrays(4096))
  const idle = await measureInProcess(() => {})

  expect(churn.supported).toBe(true)
  expect(churn.metrics.sampledAllocatedBytes).toBeGreaterThanOrEqual(16 * MiB)
  expect(churn.metrics.sampledAllocatedBytes).toBeLessThanOrEqual(64 * MiB)
  expect(churn.topSelfBytes[0].functionName).toBe('allocateShortLivedDoubleArrays')
  expect(churn.topSelfBytes[0].url).toContain('MeasureSampledAllocationChurn.test.ts')
  expect(idle.supported).toBe(true)
  expect(idle.metrics.sampledAllocatedBytes).toBeLessThan(4 * MiB)
}, 30_000)
