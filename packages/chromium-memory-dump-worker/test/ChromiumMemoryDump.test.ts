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
