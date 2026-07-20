import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@jest/globals'
import * as CreateBrowserPerformanceCountersChart from '../src/parts/CreateBrowserPerformanceCountersChart/CreateBrowserPerformanceCountersChart.ts'
import { getBrowserPerformanceCountersData } from '../src/parts/GetBrowserPerformanceCountersData/GetBrowserPerformanceCountersData.ts'

test('getBrowserPerformanceCountersData returns available metric deltas per test file', async () => {
  const workspaceRoot = await mkdtemp(join(tmpdir(), 'browser-performance-counters-data-'))
  const basePath = join(workspaceRoot, '.vscode-memory-leak-finder-results')
  const resultsPath = join(basePath, 'browser-performance-counters')

  await mkdir(resultsPath, { recursive: true })
  await writeFile(
    join(resultsPath, 'chat.json'),
    JSON.stringify({
      browserPerformanceCounters: {
        metrics: [
          { available: true, delta: 2, name: 'layoutCount' },
          { available: false, delta: null, name: 'paintCount' },
          { available: true, delta: 7, name: 'taskDurationMs' },
        ],
      },
    }),
  )

  try {
    const result = await getBrowserPerformanceCountersData(basePath)

    expect(result).toEqual([
      {
        data: [
          { name: 'taskDurationMs', value: 7 },
          { name: 'layoutCount', value: 2 },
        ],
        filename: 'chat',
      },
    ])
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true })
  }
})

test('createBrowserPerformanceCountersChart uses bar chart multi-chart configuration', () => {
  expect(CreateBrowserPerformanceCountersChart.name).toBe('browser-performance-counters')
  expect(CreateBrowserPerformanceCountersChart.multiple).toBe(true)
  expect(CreateBrowserPerformanceCountersChart.createChart()).toEqual(
    expect.objectContaining({
      type: 'bar-chart',
      yLabel: 'Browser Performance Counter Deltas',
    }),
  )
})
