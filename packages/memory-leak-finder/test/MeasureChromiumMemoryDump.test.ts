import { existsSync } from 'node:fs'
import { afterEach, expect, jest, test } from '@jest/globals'
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

const createSession = ({
  dataLossOccurred = false,
  dumpSuccess = true,
  readError = '',
  emptyChunk = false,
  noStream = false,
  omitComplete = false,
  closeError = '',
  streamForever = false,
} = {}) => {
  const calls: unknown[] = []
  const listeners: Record<string, (message: unknown) => void> = {}
  const traceData = streamForever ? 'x'.repeat(256 * 1024) : JSON.stringify({ traceEvents })
  const invokeBrowser = jest.fn(async (method: string, params: unknown) => {
    calls.push([method, params])
    if (method === 'Tracing.requestMemoryDump') {
      return { result: { dumpGuid: '0x2', success: dumpSuccess } }
    }
    if (method === 'Tracing.end') {
      if (!omitComplete)
        listeners['Tracing.tracingComplete']?.({ params: { dataLossOccurred, ...(noStream ? {} : { stream: 'owned-trace' }) } })
    }
    if (method === 'IO.read') {
      if (readError) return { error: { message: readError } }
      return { result: { data: emptyChunk ? '' : traceData, eof: !emptyChunk && !streamForever } }
    }
    if (method === 'IO.close' && closeError) return { error: { message: closeError } }
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
        transferMode: 'ReturnAsStream',
      },
    ],
    ['Tracing.requestMemoryDump', { deterministic: true, levelOfDetail: 'detailed' }],
    ['Tracing.requestMemoryDump', { deterministic: true, levelOfDetail: 'detailed' }],
    ['Tracing.end', {}],
    ['IO.read', { handle: 'owned-trace', size: 256 * 1024 }],
    ['IO.close', { handle: 'owned-trace' }],
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

  expect(calls.map((call: any) => call[0])).toEqual(['Tracing.start', 'Tracing.requestMemoryDump', 'Tracing.end', 'IO.close'])
  expect(session.listeners).toEqual({})
})

afterEach(() => {
  jest.useRealTimers()
})

test.each([
  [{ readError: 'stream disconnected', emptyChunk: false, noStream: false }, 'stream disconnected'],
  [{ readError: '', emptyChunk: true, noStream: false }, 'made no progress'],
  [{ readError: '', emptyChunk: false, noStream: true }, 'without a stream handle'],
] as const)('failed stream capture remains incomplete and releases its handle', async (options, message) => {
  const { calls, session } = createSession(options)
  const args = MeasureChromiumMemoryDump.create(session)
  await MeasureChromiumMemoryDump.start(...args)
  await expect(MeasureChromiumMemoryDump.stop(...args)).rejects.toThrow(message)
  await MeasureChromiumMemoryDump.releaseResources(...args)
  expect({
    captured: args[1].captured,
    fileExists: existsSync(args[1].capturePath),
    closeCount: calls.filter((call: any) => call[0] === 'IO.close').length,
  }).toEqual({ captured: false, fileExists: false, closeCount: options.noStream ? 0 : 1 })
})

test('missing trace completion rejects within its bounded wait and removes listeners', async () => {
  jest.useFakeTimers()
  const { session } = createSession({ omitComplete: true })
  const args = MeasureChromiumMemoryDump.create(session)
  await MeasureChromiumMemoryDump.start(...args)
  const stop = MeasureChromiumMemoryDump.stop(...args)
  const rejected = expect(stop).rejects.toThrow('completion timed out after 10000ms')
  await jest.advanceTimersByTimeAsync(10000)
  await rejected
  await MeasureChromiumMemoryDump.releaseResources(...args)
  expect({ captured: args[1].captured, listeners: session.listeners, timers: jest.getTimerCount() }).toEqual({
    captured: false,
    listeners: {},
    timers: 0,
  })
})

test('a failed stream close is not accepted as a complete capture', async () => {
  const { calls, session } = createSession({ closeError: 'close disconnected' })
  const args = MeasureChromiumMemoryDump.create(session)
  await MeasureChromiumMemoryDump.start(...args)
  await expect(MeasureChromiumMemoryDump.stop(...args)).rejects.toThrow('close disconnected')
  await MeasureChromiumMemoryDump.releaseResources(...args)
  expect({
    captured: args[1].captured,
    fileExists: existsSync(args[1].capturePath),
    closeCount: calls.filter((call: any) => call[0] === 'IO.close').length,
  }).toEqual({ captured: false, fileExists: false, closeCount: 1 })
})

test('a non-terminating trace is bounded without retaining all its chunks', async () => {
  const { calls, session } = createSession({ streamForever: true })
  const args = MeasureChromiumMemoryDump.create(session)
  await MeasureChromiumMemoryDump.start(...args)
  await expect(MeasureChromiumMemoryDump.stop(...args)).rejects.toThrow('268435456 byte capture budget')
  await MeasureChromiumMemoryDump.releaseResources(...args)
  expect({
    captured: args[1].captured,
    fileExists: existsSync(args[1].capturePath),
    reads: calls.filter((call: any) => call[0] === 'IO.read').length,
    closes: calls.filter((call: any) => call[0] === 'IO.close').length,
  }).toEqual({ captured: false, fileExists: false, reads: 1025, closes: 1 })
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
