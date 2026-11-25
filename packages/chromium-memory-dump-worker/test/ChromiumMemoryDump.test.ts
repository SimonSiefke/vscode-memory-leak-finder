import { expect, test } from '@jest/globals'
import {
  createChromiumMemoryDumpResult,
  createUnsupportedResult,
  getDetailedDumpSnapshots,
} from '../src/parts/ChromiumMemoryDump/ChromiumMemoryDump.ts'

const metadata = (pid: number, name: string) => ({
  args: { name },
  name: 'process_name',
  ph: 'M',
  pid,
})

const totals = (id: string, pid: number, ts: number, privateFootprint: string, peakRss: string) => ({
  args: {
    dumps: {
      level_of_detail: 'detailed',
      process_totals: {
        peak_resident_set_size: peakRss,
        private_footprint_bytes: privateFootprint,
      },
    },
  },
  id,
  name: 'periodic_interval',
  ph: 'v',
  pid,
  ts,
})

const allocators = (id: string, pid: number, ts: number, values: Record<string, { effective?: string; guid: string; size?: string }>) => ({
  args: {
    dumps: {
      allocators: Object.fromEntries(
        Object.entries(values).map(([name, value]) => [
          name,
          {
            attrs: {
              ...(value.effective
                ? {
                    effective_size: {
                      type: 'scalar',
                      units: 'bytes',
                      value: value.effective,
                    },
                  }
                : {}),
              ...(value.size
                ? {
                    size: {
                      type: 'scalar',
                      units: 'bytes',
                      value: value.size,
                    },
                  }
                : {}),
            },
            guid: value.guid,
          },
        ]),
      ),
      allocators_graph: [
        {
          importance: 1,
          source: 'source-guid',
          target: 'target-guid',
          type: 'ownership',
        },
      ],
      level_of_detail: 'detailed',
    },
  },
  id,
  name: 'periodic_interval',
  ph: 'v',
  pid,
  ts,
})

const createTrace = () => [
  metadata(100, 'Renderer'),
  metadata(200, 'Renderer'),
  totals('0x0', 100, 10, '1000', '2000'),
  totals('0x0', 200, 10, '800', '1000'),
  allocators('0x0', 100, 11, {
    blink_gc: { effective: '100', guid: 'before-blink', size: '200' },
    'blink_gc/main': { guid: 'before-main', size: '80' },
  }),
  totals('0x1', 100, 20, '1800', '2800'),
  totals('0x1', 200, 20, '700', '1100'),
  allocators('0x1', 100, 21, {
    blink_gc: { effective: '180', guid: 'after-blink', size: '300' },
    'blink_gc/main': { guid: 'after-main', size: 'a0' },
  }),
]

test('detailed dump parser merges fragments and decodes Chromium hexadecimal scalars', () => {
  const dumps = getDetailedDumpSnapshots(createTrace())

  expect(dumps).toHaveLength(2)
  expect(dumps[0].processes).toEqual([
    {
      name: 'Renderer',
      peakResidentSetBytes: 8192,
      pid: 100,
      privateFootprintBytes: 4096,
      residentSetBytes: null,
    },
    {
      name: 'Renderer',
      peakResidentSetBytes: 4096,
      pid: 200,
      privateFootprintBytes: 2048,
      residentSetBytes: null,
    },
  ])
  expect(dumps[0].allocators[0]).toMatchObject({
    effectiveSizeBytes: 256,
    path: 'blink_gc',
    pid: 100,
    processName: 'Renderer',
    sizeBytes: 512,
  })
  expect(dumps[0].ownershipEdges).toEqual([
    {
      importance: 1,
      pid: 100,
      source: 'source-guid',
      target: 'target-guid',
      type: 'ownership',
    },
  ])
})

test('comparison distinguishes duplicate process names and prefers effective size', () => {
  const result = createChromiumMemoryDumpResult(createTrace(), false, 100)

  expect(result).toMatchObject({
    allocatorCount: 2,
    complete: true,
    dataLossOccurred: false,
    dumpCount: 2,
    isLeak: false,
    processCount: 2,
    supported: true,
  })
  expect(result.processes.map((process) => process.displayName)).toEqual(['Renderer (PID 100) — inspected', 'Renderer (PID 200)'])
  expect(result.processes[0].delta.privateFootprintBytes).toBe(2048)
  expect(result.allocators.find((allocator) => allocator.path === 'blink_gc')).toMatchObject({
    deltaBytes: 128,
    metric: 'effective_size',
    selectedAfterBytes: 384,
    selectedBeforeBytes: 256,
  })
  expect(result.summary.largestProcessChanges[0]).toMatchObject({ pid: 100 })
  expect(result.summary.largestAllocatorChanges[0]).toMatchObject({ path: 'blink_gc' })
})

test('comparison falls back to allocator size when effective size is missing', () => {
  const result = createChromiumMemoryDumpResult(createTrace(), false)
  const row = result.allocators.find((allocator) => allocator.path === 'blink_gc/main')

  expect(row).toMatchObject({
    deltaBytes: 32,
    metric: 'size',
    selectedAfterBytes: 160,
    selectedBeforeBytes: 128,
  })
})

test('data loss and missing dumps produce incomplete results', () => {
  const dataLossResult = createChromiumMemoryDumpResult(createTrace(), true)
  const missingDumpResult = createChromiumMemoryDumpResult(
    createTrace().filter((event: any) => event.id !== '0x1'),
    false,
  )

  expect(dataLossResult).toMatchObject({
    complete: false,
    dataLossOccurred: true,
    supported: true,
    unsupportedReason: 'Chromium reported trace data loss',
  })
  expect(missingDumpResult).toMatchObject({
    complete: false,
    dumpCount: 1,
    unsupportedReason: 'Expected two detailed Chromium memory dumps, received 1',
  })
})

test('unsupported results explain why no data is available', () => {
  const unsupported = createUnsupportedResult('Tracing.requestMemoryDump was not found')

  expect(unsupported).toMatchObject({
    complete: false,
    isLeak: false,
    supported: false,
  })
  expect(unsupported.unsupportedReason).toBe('Tracing.requestMemoryDump was not found')
})

const light = (id: string, pid: number, ts: number, privateFootprint: string, peakRss: string, resettable = true) => ({
  args: {
    dumps: {
      level_of_detail: 'light',
      process_totals: {
        is_peak_rss_resettable: resettable,
        peak_resident_set_size: peakRss,
        private_footprint_bytes: privateFootprint,
      },
    },
  },
  id,
  name: 'periodic_interval',
  ph: 'v',
  pid,
  ts,
})

const resettable = (event: any, peakRss?: string) => ({
  ...event,
  args: {
    dumps: {
      ...event.args.dumps,
      process_totals: {
        ...event.args.dumps.process_totals,
        is_peak_rss_resettable: true,
        ...(peakRss ? { peak_resident_set_size: peakRss } : {}),
      },
    },
  },
})

const createPeriodicTrace = (finalPeakRss?: string) => [
  metadata(100, 'Renderer'),
  metadata(200, 'Renderer'),
  // Periodic dumps can fire before the first explicit dump and after the last one.
  light('0x0', 100, 5_000, '9000', '9000'),
  resettable(totals('0x1', 100, 10_000, '1000', '2000')),
  resettable(totals('0x1', 200, 10_000, '800', '1000')),
  allocators('0x1', 100, 10_001, { blink_gc: { effective: '100', guid: 'before-blink', size: '200' } }),
  light('0x2', 100, 22_000, '1400', '2400'),
  light('0x2', 200, 22_100, '900', '1500'),
  light('0x3', 100, 24_000, '2000', '3000'),
  light('0x3', 200, 24_000, '600', '1200'),
  light('0x4', 100, 26_000, '1c00', '2000'),
  light('0x4', 200, 26_000, '500', '1000', false),
  resettable(totals('0x5', 100, 30_000, '1800', '2800'), finalPeakRss),
  resettable(totals('0x5', 200, 30_000, '700', '1100')),
  allocators('0x5', 100, 30_001, { blink_gc: { effective: '180', guid: 'after-blink', size: '300' } }),
  light('0x6', 100, 35_000, '8000', '8000'),
]

test('periodic light dumps are summarized without changing the detailed endpoints', () => {
  const trace = createPeriodicTrace()
  const detailedOnly = trace.filter((event: any) => event.args?.dumps?.level_of_detail !== 'light')
  const { periodic, ...result } = createChromiumMemoryDumpResult(trace, false, 200, 250)

  expect(result).toEqual(createChromiumMemoryDumpResult(detailedOnly, false, 200))
  expect(result).toMatchObject({ complete: true, dumpCount: 2, unsupportedReason: '' })
  expect(periodic).toEqual({
    levelOfDetail: 'light',
    maxTotalPrivateFootprintBytes: 0x2000 + 0x600,
    medianIntervalMs: 2,
    outsideEndpointWindowCount: 2,
    processes: [
      {
        displayName: 'Renderer (PID 100)',
        name: 'Renderer',
        peakResidentSetBytes: { max: 0x3000, resettable: true },
        pid: 100,
        privateFootprintBytes: { first: 0x1400, last: 0x1c00, max: 0x2000, min: 0x1400 },
        sampleCount: 3,
      },
      {
        displayName: 'Renderer (PID 200) — inspected',
        name: 'Renderer',
        peakResidentSetBytes: { max: 0x1500, resettable: false },
        pid: 200,
        privateFootprintBytes: { first: 0x900, last: 0x500, max: 0x900, min: 0x500 },
        sampleCount: 3,
      },
    ],
    requestedIntervalMs: 250,
    sampleCount: 3,
    samples: [
      { offsetMs: 12, processCount: 2, totalPrivateFootprintBytes: 0x1400 + 0x900 },
      { offsetMs: 14, processCount: 2, totalPrivateFootprintBytes: 0x2000 + 0x600 },
      { offsetMs: 16, processCount: 2, totalPrivateFootprintBytes: 0x1c00 + 0x500 },
    ],
  })
})

test('the final detailed dump contributes its peak since the last light dump', () => {
  const periodic = createChromiumMemoryDumpResult(createPeriodicTrace('5000'), false, undefined, 250).periodic!

  expect(periodic.processes.find((process) => process.pid === 100)?.peakResidentSetBytes).toEqual({ max: 0x5000, resettable: true })
})

test('light dumps are ignored unless periodic sampling was requested', () => {
  const result = createChromiumMemoryDumpResult(createPeriodicTrace(), false, 100)

  expect(result).not.toHaveProperty('periodic')
  expect(result.dumpCount).toBe(2)
  expect(JSON.stringify(createChromiumMemoryDumpResult(createTrace(), false, 100))).toBe(
    JSON.stringify(createChromiumMemoryDumpResult(createTrace().concat(light('0x9', 100, 15, '1', '1')), false, 100)),
  )
})

test('light dumps are never used as comparison endpoints', () => {
  const lightOnly = [metadata(100, 'Renderer'), light('0x0', 100, 1, '100', '100'), light('0x1', 100, 2, '200', '200')]

  expect(createChromiumMemoryDumpResult(lightOnly, false, undefined, 250)).toEqual(
    createChromiumMemoryDumpResult(lightOnly.slice(0, 1), false),
  )
  expect(createChromiumMemoryDumpResult(lightOnly, false, undefined, 250)).toMatchObject({
    complete: false,
    dumpCount: 0,
    unsupportedReason: 'Expected two detailed Chromium memory dumps, received 0',
  })
})

test('requested periodic sampling without light dumps reports an empty series', () => {
  expect(createChromiumMemoryDumpResult(createTrace(), false, undefined, 1000).periodic).toEqual({
    levelOfDetail: 'light',
    maxTotalPrivateFootprintBytes: null,
    medianIntervalMs: null,
    outsideEndpointWindowCount: 0,
    processes: [],
    requestedIntervalMs: 1000,
    sampleCount: 0,
    samples: [],
  })
})
