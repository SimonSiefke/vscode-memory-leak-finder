import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@jest/globals'
import * as CreatePaintEventsChart from '../src/parts/CreatePaintEventsChart/CreatePaintEventsChart.ts'
import { getPaintEventsData } from '../src/parts/GetPaintEventsData/GetPaintEventsData.ts'

test('getPaintEventsData groups repeated document paints with selector breakdowns', async () => {
  const workspaceRoot = await mkdtemp(join(tmpdir(), 'paint-events-data-'))
  const basePath = join(workspaceRoot, '.vscode-memory-leak-finder-results')
  const resultsPath = join(basePath, 'paint-events')

  await mkdir(resultsPath, { recursive: true })
  await writeFile(
    join(resultsPath, 'chat.json'),
    JSON.stringify({
      paintEvents: {
        events: [
          {
            durationMs: 1,
            index: 1,
            nodeName: '#document',
            rects: [{ area: 100, height: 10, width: 10, x: 0, y: 0 }],
            startMs: 0,
            totalArea: 100,
          },
          {
            durationMs: 0.5,
            index: 2,
            nodeName: "DIV class='slider'",
            rects: [{ area: 20, height: 5, width: 4, x: 1, y: 2 }],
            startMs: 1,
            totalArea: 20,
          },
          {
            durationMs: 2,
            index: 3,
            nodeName: '#document',
            rects: [{ area: 100, height: 10, width: 10, x: 0, y: 0 }],
            startMs: 10,
            totalArea: 100,
          },
          {
            durationMs: 1.5,
            index: 4,
            nodeName: "DIV class='slider'",
            rects: [{ area: 20, height: 5, width: 4, x: 1, y: 2 }],
            startMs: 11,
            totalArea: 20,
          },
          {
            durationMs: 4,
            index: 5,
            nodeName: '#document',
            rects: [{ area: 200, height: 10, width: 20, x: 0, y: 0 }],
            startMs: 20,
            totalArea: 200,
          },
          {
            durationMs: 3,
            index: 6,
            nodeName: "SPAN class='slow'",
            rects: [{ area: 100, height: 10, width: 10, x: 3, y: 4 }],
            startMs: 21,
            totalArea: 100,
          },
        ],
      },
    }),
  )

  try {
    const result = await getPaintEventsData(basePath)

    expect(result).toEqual([
      {
        data: [
          expect.objectContaining({
            averageDurationMs: 7,
            averagePaintedArea: 300,
            count: 1,
            paintCount: 2,
            selectorSummary: 'span.slow',
          }),
          expect.objectContaining({
            averageDurationMs: 2.5,
            averagePaintedArea: 120,
            count: 2,
            paintCount: 4,
            selectorSummary: 'div.slider',
          }),
        ],
        filename: 'chat',
      },
    ])
    expect(result[0].data[1].components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          averageDurationMs: 1,
          count: 2,
          selector: 'div.slider',
          width: 4,
          x: 1,
          y: 2,
        }),
      ]),
    )
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true })
  }
})

test('getPaintEventsData caps chart groups at 20', async () => {
  const workspaceRoot = await mkdtemp(join(tmpdir(), 'paint-events-data-cap-'))
  const basePath = join(workspaceRoot, '.vscode-memory-leak-finder-results')
  const resultsPath = join(basePath, 'paint-events')

  await mkdir(resultsPath, { recursive: true })
  await writeFile(
    join(resultsPath, 'many.json'),
    JSON.stringify({
      paintEvents: {
        events: Array.from({ length: 25 }, (_, index) => [
          {
            durationMs: index,
            index: index * 2 + 1,
            nodeName: '#document',
            rects: [{ area: index + 1, height: 1, width: index + 1, x: 0, y: 0 }],
            startMs: index * 10,
            totalArea: index + 1,
          },
          {
            durationMs: index / 2,
            index: index * 2 + 2,
            nodeName: `DIV class='paint-${index}'`,
            rects: [{ area: index + 1, height: 1, width: index + 1, x: index, y: 0 }],
            startMs: index * 10 + 1,
            totalArea: index + 1,
          },
        ]).flat(),
      },
    }),
  )

  try {
    const result = await getPaintEventsData(basePath)

    expect(result[0].data).toHaveLength(20)
    expect(result[0].data[0]).toEqual(
      expect.objectContaining({
        averageDurationMs: 36,
        selectorSummary: 'div.paint-24',
      }),
    )
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true })
  }
})

test('createPaintEventsChart uses paint events chart multi-chart configuration', () => {
  expect(CreatePaintEventsChart.name).toBe('paint-events')
  expect(CreatePaintEventsChart.multiple).toBe(true)
  expect(CreatePaintEventsChart.createChart()).toEqual(
    expect.objectContaining({
      type: 'paint-events-chart',
      width: 1180,
    }),
  )
})
