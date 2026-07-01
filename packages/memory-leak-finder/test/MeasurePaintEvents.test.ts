import { expect, test } from '@jest/globals'
import * as GetMeasure from '../src/parts/GetMeasure/GetMeasure.ts'
import * as MeasurePaintEvents from '../src/parts/MeasurePaintEvents/MeasurePaintEvents.ts'

test('paint events measure lifecycle starts tracing and parses paint events', async () => {
  const calls: unknown[] = []
  const listeners = Object.create(null)
  const session = {
    listeners,
    dispose() {},
    invoke(method: string, params: unknown) {
      calls.push([method, params])
      switch (method) {
        case 'LayerTree.enable':
          queueMicrotask(() => {
            listeners['LayerTree.layerTreeDidChange']?.({ params: { layers: [{ layerId: 'layer-1' }] } })
            listeners['LayerTree.layerPainted']?.({
              params: {
                clip: { height: 4, width: 3, x: 1, y: 2 },
                layerId: 'layer-1',
              },
              timestamp: 0.004,
            })
          })
          return Promise.resolve({ result: {} })
        case 'LayerTree.disable':
          return Promise.resolve({ result: {} })
        case 'Tracing.start':
          return Promise.resolve({ result: {} })
        case 'Tracing.end':
          queueMicrotask(() => {
            listeners['Tracing.dataCollected']?.({
              params: {
                value: [
                  { name: 'EventDispatch', ts: 1_000 },
                  {
                    args: {
                      data: {
                        clip: [10, 20, 30, 40],
                        layerId: 'layer-2',
                        nodeId: 7,
                        nodeName: 'SPAN',
                      },
                    },
                    dur: 2_500,
                    name: 'Paint',
                    ts: 2_000,
                  },
                ],
              },
            })
            listeners['Tracing.tracingComplete']?.({ params: { dataLossOccurred: true } })
          })
          return Promise.resolve({ result: {} })
        default:
          throw new Error(`unexpected method ${method}`)
      }
    },
    off(event: string, listener: unknown) {
      if (listeners[event] === listener) {
        delete listeners[event]
      }
    },
    on(event: string, listener: unknown) {
      listeners[event] = listener
    },
  } as any

  const args = MeasurePaintEvents.create(session) as [any, any]
  const before = await MeasurePaintEvents.start(...args)
  const after = await MeasurePaintEvents.stop(...args)
  await MeasurePaintEvents.releaseResources(...args)

  expect(before.metrics.paintCount).toBe(0)
  expect(after.metrics).toEqual({
    averageDurationMs: 1.25,
    dataLossOccurred: true,
    maxDurationMs: 2.5,
    paintAreaCount: 2,
    paintCount: 2,
    totalDurationMs: 2.5,
    totalPaintedArea: 1212,
  })
  expect(after.events).toEqual([
    {
      durationMs: 2.5,
      index: 1,
      layerId: 'layer-2',
      nodeId: 7,
      nodeName: 'SPAN',
      rects: [{ area: 1200, height: 40, width: 30, x: 10, y: 20 }],
      source: 'trace',
      startMs: 1,
      timestampUs: 2_000,
      totalArea: 1200,
    },
    {
      durationMs: 0,
      index: 2,
      layerId: 'layer-1',
      nodeId: 0,
      nodeName: '',
      rects: [{ area: 12, height: 4, width: 3, x: 1, y: 2 }],
      source: 'layer-tree',
      startMs: 3,
      timestampUs: 4_000,
      totalArea: 12,
    },
  ])
  expect(calls).toEqual([
    ['LayerTree.enable', {}],
    [
      'Tracing.start',
      {
        transferMode: 'ReportEvents',
        traceConfig: {
          includedCategories: [
            '-*',
            'devtools.timeline',
            'disabled-by-default-devtools.timeline',
            'disabled-by-default-devtools.timeline.layers',
            'disabled-by-default-devtools.timeline.picture',
            'disabled-by-default-cc',
            'disabled-by-default-cc.debug',
          ],
          recordMode: 'recordUntilFull',
        },
      },
    ],
    ['Tracing.end', {}],
    ['LayerTree.disable', {}],
  ])
  expect(listeners['Tracing.dataCollected']).toBeUndefined()
  expect(listeners['Tracing.tracingComplete']).toBeUndefined()
  expect(listeners['LayerTree.layerPainted']).toBeUndefined()
  expect(listeners['LayerTree.layerTreeDidChange']).toBeUndefined()
})

test('paint events measure compares as informational only', () => {
  const result = MeasurePaintEvents.compare(
    {
      events: [],
      layerPaintEvents: [],
      layerTreeEvents: [],
      metrics: {
        averageDurationMs: 0,
        dataLossOccurred: false,
        maxDurationMs: 0,
        paintAreaCount: 0,
        paintCount: 0,
        totalDurationMs: 0,
        totalPaintedArea: 0,
      },
      rawEvents: [],
    },
    {
      events: [
        {
          durationMs: 2.5,
          index: 1,
          layerId: 'layer-1',
          nodeId: 0,
          nodeName: '',
          rects: [{ area: 12, height: 4, width: 3, x: 1, y: 2 }],
          source: 'trace',
          startMs: 1,
          timestampUs: 2_000,
          totalArea: 12,
        },
      ],
      layerPaintEvents: [],
      layerTreeEvents: [],
      metrics: {
        averageDurationMs: 2.5,
        dataLossOccurred: false,
        maxDurationMs: 2.5,
        paintAreaCount: 1,
        paintCount: 1,
        totalDurationMs: 2.5,
        totalPaintedArea: 12,
      },
      rawEvents: [{ dur: 2_500, name: 'Paint', ts: 2_000 }],
    },
  )

  expect(result.isLeak).toBe(false)
  expect(MeasurePaintEvents.isLeak()).toBe(false)
  expect(result.metrics.paintCount).toBe(1)
  expect(result.raw.after.traceEvents).toEqual([{ dur: 2_500, name: 'Paint', ts: 2_000 }])
})

test('paint-events resolves through measure lookup', () => {
  const MemoryLeakFinder = {
    Measures: {
      MeasurePaintEvents,
    },
  }
  const measure = GetMeasure.getMeasure(MemoryLeakFinder, 'paint-events')

  expect(measure.id).toBe('paintEvents')
})
