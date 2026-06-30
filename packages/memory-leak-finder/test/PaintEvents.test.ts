import { expect, test } from '@jest/globals'
import { formatPaintEventsSummary, getPaintEvents } from '../src/parts/PaintEvents/PaintEvents.ts'

test('getPaintEvents aggregates trace paint events with clip and duration', () => {
  const result = getPaintEvents(
    [
      { name: 'EventDispatch', ts: 9000 },
      {
        args: {
          data: {
            clip: [10, 20, 30, 40],
            layerId: 'layer-1',
            nodeId: 42,
            nodeName: 'DIV',
          },
        },
        dur: 2500,
        name: 'Paint',
        ts: 10_000,
      },
    ],
    [],
    [],
    true,
  )

  expect(result.metrics).toEqual({
    averageDurationMs: 2.5,
    dataLossOccurred: true,
    maxDurationMs: 2.5,
    paintAreaCount: 1,
    paintCount: 1,
    totalDurationMs: 2.5,
    totalPaintedArea: 1200,
  })
  expect(result.events).toEqual([
    {
      durationMs: 2.5,
      index: 1,
      layerId: 'layer-1',
      nodeId: 42,
      nodeName: 'DIV',
      rects: [{ area: 1200, height: 40, width: 30, x: 10, y: 20 }],
      source: 'trace',
      startMs: 1,
      timestampUs: 10_000,
      totalArea: 1200,
    },
  ])
})

test('getPaintEvents aggregates layer tree painted events with object clip rects', () => {
  const result = getPaintEvents(
    [{ name: 'EventDispatch', ts: 1_000 }],
    [
      {
        params: {
          clip: { height: 6, width: 5, x: 3, y: 4 },
          layerId: 'layer-2',
        },
        timestamp: 0.002,
      },
    ],
  )

  expect(result.metrics).toEqual({
    averageDurationMs: 0,
    dataLossOccurred: false,
    maxDurationMs: 0,
    paintAreaCount: 1,
    paintCount: 1,
    totalDurationMs: 0,
    totalPaintedArea: 30,
  })
  expect(result.events[0]).toEqual({
    durationMs: 0,
    index: 1,
    layerId: 'layer-2',
    nodeId: 0,
    nodeName: '',
    rects: [{ area: 30, height: 6, width: 5, x: 3, y: 4 }],
    source: 'layer-tree',
    startMs: 1,
    timestampUs: 2_000,
    totalArea: 30,
  })
})

test('getPaintEvents tolerates missing duration and clip data', () => {
  const result = getPaintEvents([
    { name: 'Paint', ts: 2_000 },
    { name: 'Paint', ts: 3_000, dur: Number.NaN },
  ])

  expect(result.metrics).toEqual({
    averageDurationMs: 0,
    dataLossOccurred: false,
    maxDurationMs: 0,
    paintAreaCount: 0,
    paintCount: 2,
    totalDurationMs: 0,
    totalPaintedArea: 0,
  })
  expect(result.events).toEqual([
    {
      durationMs: 0,
      index: 1,
      layerId: '',
      nodeId: 0,
      nodeName: '',
      rects: [],
      source: 'trace',
      startMs: 0,
      timestampUs: 2_000,
      totalArea: 0,
    },
    {
      durationMs: 0,
      index: 2,
      layerId: '',
      nodeId: 0,
      nodeName: '',
      rects: [],
      source: 'trace',
      startMs: 1,
      timestampUs: 3_000,
      totalArea: 0,
    },
  ])
})

test('getPaintEvents aggregates multiple rect sources and polygon clips', () => {
  const result = getPaintEvents(
    [
      {
        args: {
          data: {
            clip: [10, 10, 30, 10, 30, 20, 10, 20],
          },
        },
        dur: 1000,
        name: 'Paint',
        ts: 1_000,
      },
    ],
    [
      {
        params: {
          clip: { height: 10, width: 10, x: 0, y: 0 },
          layerId: 'layer-3',
        },
        timestamp: 0.002,
      },
    ],
  )

  expect(result.metrics).toEqual({
    averageDurationMs: 0.5,
    dataLossOccurred: false,
    maxDurationMs: 1,
    paintAreaCount: 2,
    paintCount: 2,
    totalDurationMs: 1,
    totalPaintedArea: 300,
  })
})

test('formatPaintEventsSummary returns compact text with largest paint events', () => {
  const summary = formatPaintEventsSummary(
    getPaintEvents([
      { args: { data: { clip: [0, 0, 5, 5], layerId: 'small' } }, dur: 1000, name: 'Paint', ts: 1_000 },
      { args: { data: { clip: [0, 0, 10, 10], layerId: 'large' } }, dur: 3000, name: 'Paint', ts: 2_000 },
    ]),
  )

  expect(summary).toContain('Paint events:')
  expect(summary).toContain('paintCount | 2')
  expect(summary).toContain('index | source | startMs | durationMs | totalArea | rectCount | layerId')
  expect(summary).toContain('2 | trace | 1 | 3 | 100 | 1 | large')
})
