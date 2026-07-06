import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@jest/globals'
import * as CreateFrontendStartupPerformanceChart from '../src/parts/CreateFrontendStartupPerformanceChart/CreateFrontendStartupPerformanceChart.ts'
import { getFrontendStartupPerformanceData } from '../src/parts/GetFrontendStartupPerformanceData/GetFrontendStartupPerformanceData.ts'

test('getFrontendStartupPerformanceData returns median metric values per test file', async () => {
  const workspaceRoot = await mkdtemp(join(tmpdir(), 'frontend-startup-performance-data-'))
  const basePath = join(workspaceRoot, '.vscode-memory-leak-finder-results')
  const resultsPath = join(basePath, 'frontend-startup-performance')

  await mkdir(resultsPath, { recursive: true })
  await writeFile(
    join(resultsPath, 'window-open-new.json'),
    JSON.stringify({
      frontendStartupPerformance: {
        metrics: [{ median: 25, name: 'duration' }, { median: 12, name: 'loadEventEnd' }, { name: 'first-paint' }],
      },
    }),
  )

  try {
    const result = await getFrontendStartupPerformanceData(basePath)

    expect(result).toEqual([
      {
        data: [
          { name: 'duration', value: 25 },
          { name: 'loadEventEnd', value: 12 },
        ],
        filename: 'window-open-new',
      },
    ])
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true })
  }
})

test('createFrontendStartupPerformanceChart uses bar chart multi-chart configuration', () => {
  expect(CreateFrontendStartupPerformanceChart.name).toBe('frontend-startup-performance')
  expect(CreateFrontendStartupPerformanceChart.multiple).toBe(true)
  expect(CreateFrontendStartupPerformanceChart.createChart()).toEqual(
    expect.objectContaining({
      type: 'bar-chart',
      xLabel: 'Median (ms)',
    }),
  )
})
