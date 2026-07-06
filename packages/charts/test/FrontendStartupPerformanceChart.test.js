import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@jest/globals'
import * as CreateFrontendStartupPerformanceChart from '../src/parts/CreateFrontendStartupPerformanceChart/CreateFrontendStartupPerformanceChart.ts'
import { getFrontendStartupPerformanceData } from '../src/parts/GetFrontendStartupPerformanceData/GetFrontendStartupPerformanceData.ts'

test('getFrontendStartupPerformanceData returns workbench startup values per run', async () => {
  const workspaceRoot = await mkdtemp(join(tmpdir(), 'frontend-startup-performance-data-'))
  const basePath = join(workspaceRoot, '.vscode-memory-leak-finder-results')
  const resultsPath = join(basePath, 'frontend-startup-performance')

  await mkdir(resultsPath, { recursive: true })
  await writeFile(
    join(resultsPath, 'window-open-new.json'),
    JSON.stringify({
      frontendStartupPerformance: {
        metrics: [{ median: 25, name: 'duration' }],
        samples: [{ workbenchStartup: 12, runIndex: 1 }, { workbenchStartup: 8, runIndex: 0 }, { duration: 25 }],
      },
    }),
  )

  try {
    const result = await getFrontendStartupPerformanceData(basePath)

    expect(result).toEqual([
      {
        data: [
          { runIndex: 0, value: 8 },
          { runIndex: 1, value: 12 },
        ],
        filename: 'window-open-new',
      },
    ])
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true })
  }
})

test('createFrontendStartupPerformanceChart uses line chart multi-chart configuration', () => {
  expect(CreateFrontendStartupPerformanceChart.name).toBe('frontend-startup-performance')
  expect(CreateFrontendStartupPerformanceChart.multiple).toBe(true)
  expect(CreateFrontendStartupPerformanceChart.createChart()).toEqual(
    expect.objectContaining({
      type: 'line-chart',
      x: 'runIndex',
      y: 'value',
      yLabel: 'workbenchStartup (ms)',
    }),
  )
})
