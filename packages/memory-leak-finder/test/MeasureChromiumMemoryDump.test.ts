import { existsSync } from 'node:fs'
import { expect, jest, test } from '@jest/globals'
import * as GetMeasure from '../src/parts/GetMeasure/GetMeasure.ts'
import * as MeasureChromiumMemoryDump from '../src/parts/MeasureChromiumMemoryDump/MeasureChromiumMemoryDump.ts'
import * as TargetId from '../src/parts/TargetId/TargetId.ts'

const traceEvents = [
  { args: { name: 'Renderer' }, name: 'process_name', ph: 'M', pid: 10 },
  {
    args: {
      dumps: {
        level_of_detail: 'detailed',
        process_totals: { peak_resident_set_size: '200', private_footprint_bytes: '100' },
      },
    },
    id: '0x0',
    ph: 'v',
    pid: 10,
    ts: 1,
  },
  {
    args: {
      dumps: {
        allocators: {
          v8: {
            attrs: { effective_size: { type: 'scalar', units: 'bytes', value: '20' } },
            guid: 'before-v8',
          },
        },
        level_of_detail: 'detailed',
      },
    },
    id: '0x0',
    ph: 'v',
    pid: 10,
    ts: 2,
  },
  {
    args: {
      dumps: {
        level_of_detail: 'detailed',
        process_totals: { peak_resident_set_size: '300', private_footprint_bytes: '180' },
      },
    },
    id: '0x1',
    ph: 'v',
    pid: 10,
    ts: 3,
  },
  {
    args: {
      dumps: {
        allocators: {
          v8: {
            attrs: { effective_size: { type: 'scalar', units: 'bytes', value: '40' } },
            guid: 'after-v8',
          },
        },
        level_of_detail: 'detailed',
      },
    },
    id: '0x1',
    ph: 'v',
    pid: 10,
    ts: 4,
  },
]

const createSession = ({ dataLossOccurred = false, dumpSuccess = true } = {}) => {
  const calls: unknown[] = []
  const listeners: Record<string, (message: unknown) => void> = {}
  const invokeBrowser = jest.fn(async (method: string, params: unknown) => {
    calls.push([method, params])
    if (method === 'Tracing.requestMemoryDump') {
      return { result: { dumpGuid: '0x2', success: dumpSuccess } }
    }
    if (method === 'Tracing.end') {
      listeners['Tracing.dataCollected']?.({ params: { value: traceEvents } })
      listeners['Tracing.tracingComplete']?.({ params: { dataLossOccurred } })
    }
    return { result: {} }
  })
  return {
    calls,
    session: {
      callbacks: {},
      connectionClosed: () => false,
      dispose() {},
      electronWebSocketUrl: '',
      invoke: jest.fn(),
      invokeBrowser,
      listeners,
      off(event: string) {
        delete listeners[event]
      },
      on(event: string, listener: (message: unknown) => void) {
        listeners[event] = listener
      },
      targetId: 'target-1',
    } as any,
  }
}

test('measure captures two deterministic detailed dumps through the root browser connection', async () => {
  const { calls, session } = createSession()
  const args = MeasureChromiumMemoryDump.create(session)

  const before = await MeasureChromiumMemoryDump.start(...args)
  const after = await MeasureChromiumMemoryDump.stop(...args)
  const result = await MeasureChromiumMemoryDump.compare(before, after)
  await MeasureChromiumMemoryDump.releaseResources(...args)

  expect(result).toMatchObject({
    allocatorCount: 1,
    complete: true,
    dumpCount: 2,
    processCount: 1,
    supported: true,
  })
  expect(existsSync(args[1].capturePath)).toBe(false)
  expect(MeasureChromiumMemoryDump.summary(result)).toContain('+128 B')
  expect(calls).toEqual([
    [
      'Tracing.start',
      {
        traceConfig: {
          excludedCategories: ['*'],
          includedCategories: ['disabled-by-default-memory-infra'],
          recordMode: 'recordAsMuchAsPossible',
        },
        transferMode: 'ReportEvents',
      },
    ],
    ['Tracing.requestMemoryDump', { deterministic: true, levelOfDetail: 'detailed' }],
    ['Tracing.requestMemoryDump', { deterministic: true, levelOfDetail: 'detailed' }],
    ['Tracing.end', {}],
  ])
})

test('measure reports trace data loss as incomplete', async () => {
  const { session } = createSession({ dataLossOccurred: true })
  const args = MeasureChromiumMemoryDump.create(session)

  const before = await MeasureChromiumMemoryDump.start(...args)
  const after = await MeasureChromiumMemoryDump.stop(...args)
  const result = await MeasureChromiumMemoryDump.compare(before, after)

  expect(result).toMatchObject({
    complete: false,
    dataLossOccurred: true,
    unsupportedReason: 'Chromium reported trace data loss',
  })
})

test('measure reports unsupported root sessions and failed dump requests', async () => {
  const listeners: Record<string, unknown> = {}
  const unsupportedSession = {
    invoke: jest.fn(),
    listeners,
    off(event: string) {
      delete listeners[event]
    },
    on(event: string, listener: unknown) {
      listeners[event] = listener
    },
  } as any
  const unsupportedArgs = MeasureChromiumMemoryDump.create(unsupportedSession)
  const unsupported = await MeasureChromiumMemoryDump.start(...unsupportedArgs)

  expect(unsupported).toMatchObject({ supported: false })
  expect(unsupported?.unsupportedReason).toContain('root Chromium browser connection')

  const { session } = createSession({ dumpSuccess: false })
  const failedArgs = MeasureChromiumMemoryDump.create(session)
  const failed = await MeasureChromiumMemoryDump.start(...failedArgs)

  expect(failed).toMatchObject({ supported: false })
  expect(failed?.unsupportedReason).toContain('did not complete')
})

test('measure reports an unsupported Chromium method and ends the trace', async () => {
  const { calls, session } = createSession()
  session.invokeBrowser.mockImplementation(async (method: string) => {
    calls.push([method, undefined])
    if (method === 'Tracing.requestMemoryDump') {
      throw Object.assign(new Error('Method not found'), { code: 'E_DEVTOOLS_METHOD_NOT_FOUND' })
    }
    if (method === 'Tracing.end') {
      session.listeners['Tracing.tracingComplete']?.({ params: { dataLossOccurred: false } })
    }
    return { result: {} }
  })
  const args = MeasureChromiumMemoryDump.create(session)

  const result = await MeasureChromiumMemoryDump.start(...args)

  expect(result).toMatchObject({ supported: false, unsupportedReason: 'Method not found' })
  expect(calls.map((call: any) => call[0])).toEqual(['Tracing.start', 'Tracing.requestMemoryDump', 'Tracing.end'])
})

test('measure ends the trace when the first dump request fails unexpectedly', async () => {
  const { calls, session } = createSession()
  session.invokeBrowser.mockImplementation(async (method: string) => {
    calls.push([method, undefined])
    if (method === 'Tracing.requestMemoryDump') {
      throw new Error('connection interrupted')
    }
    if (method === 'Tracing.end') {
      session.listeners['Tracing.tracingComplete']?.({ params: { dataLossOccurred: false } })
    }
    return { result: {} }
  })
  const args = MeasureChromiumMemoryDump.create(session)

  await expect(MeasureChromiumMemoryDump.start(...args)).rejects.toThrow('connection interrupted')

  expect(calls.map((call: any) => call[0])).toEqual(['Tracing.start', 'Tracing.requestMemoryDump', 'Tracing.end'])
})

test('release ends an active trace and removes listeners', async () => {
  const { calls, session } = createSession()
  const args = MeasureChromiumMemoryDump.create(session)

  await MeasureChromiumMemoryDump.start(...args)
  await MeasureChromiumMemoryDump.releaseResources(...args)
  await MeasureChromiumMemoryDump.releaseResources(...args)

  expect(calls.map((call: any) => call[0])).toEqual(['Tracing.start', 'Tracing.requestMemoryDump', 'Tracing.end'])
  expect(session.listeners).toEqual({})
})

test('measure is informational, browser-only, and resolves by kebab-case id', () => {
  expect(MeasureChromiumMemoryDump.id).toBe('chromiumMemoryDump')
  expect(MeasureChromiumMemoryDump.targets).toEqual([TargetId.Browser])
  expect(MeasureChromiumMemoryDump.isLeak()).toBe(false)
  expect(
    GetMeasure.getMeasure(
      {
        Measures: { MeasureChromiumMemoryDump },
      },
      'chromium-memory-dump',
    ).id,
  ).toBe('chromiumMemoryDump')
})
