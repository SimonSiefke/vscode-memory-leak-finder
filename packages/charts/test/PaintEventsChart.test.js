import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@jest/globals'
import * as CreatePaintEventsChart from '../src/parts/CreatePaintEventsChart/CreatePaintEventsChart.ts'
import { getPaintEventsData } from '../src/parts/GetPaintEventsData/GetPaintEventsData.ts'

test('getPaintEventsData returns largest paint events per test file', async () => {
  const workspaceRoot = await mkdtemp(join(tmpdir(), 'paint-events-data-'))
  const basePath = join(workspaceRoot, '.vscode-memory-leak-finder-results')
  const resultsPath = join(basePath, 'paint-events')

  await mkdir(resultsPath, { recursive: true })
  await writeFile(
    join(resultsPath, 'chat.json'),
    JSON.stringify({
      paintEvents: {
        events: [
          { durationMs: 1, index: 1, startMs: 0, totalArea: 10 },
          { durationMs: 3, index: 2, startMs: 4.5, totalArea: 30 },
          { durationMs: 2, index: 3, startMs: 9, totalArea: 20 },
        ],
      },
    }),
  )

  try {
    const result = await getPaintEventsData(basePath)

    expect(result).toEqual([
      {
        data: [
          { name: '#2 @ 4.5ms (3ms)', value: 30 },
          { name: '#3 @ 9ms (2ms)', value: 20 },
          { name: '#1 @ 0ms (1ms)', value: 10 },
        ],
        filename: 'chat',
      },
    ])
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true })
  }
})

test('getPaintEventsData caps chart rows at 50', async () => {
  const workspaceRoot = await mkdtemp(join(tmpdir(), 'paint-events-data-cap-'))
  const basePath = join(workspaceRoot, '.vscode-memory-leak-finder-results')
  const resultsPath = join(basePath, 'paint-events')

  await mkdir(resultsPath, { recursive: true })
  await writeFile(
    join(resultsPath, 'many.json'),
    JSON.stringify({
      paintEvents: {
        events: Array.from({ length: 60 }, (_, index) => ({
          durationMs: index,
          index: index + 1,
          startMs: index * 10,
          totalArea: index,
        })),
      },
    }),
  )

  try {
    const result = await getPaintEventsData(basePath)

    expect(result[0].data).toHaveLength(50)
    expect(result[0].data[0]).toEqual({ name: '#60 @ 590ms (59ms)', value: 59 })
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true })
  }
})

test('createPaintEventsChart uses bar chart multi-chart configuration', () => {
  expect(CreatePaintEventsChart.name).toBe('paint-events')
  expect(CreatePaintEventsChart.multiple).toBe(true)
  expect(CreatePaintEventsChart.createChart()).toEqual(
    expect.objectContaining({
      type: 'bar-chart',
      xLabel: 'Painted Area',
      yLabel: 'Largest Paint Events',
    }),
  )
})
