import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@jest/globals'
import * as Charts from '../src/parts/Charts/Charts.ts'
import * as CreatePerformanceMarkBytesChart from '../src/parts/CreatePerformanceMarkBytesChart/CreatePerformanceMarkBytesChart.ts'
import * as CreatePerformanceMarkCountsChart from '../src/parts/CreatePerformanceMarkCountsChart/CreatePerformanceMarkCountsChart.ts'
import { getPerformanceMarkBytesData } from '../src/parts/GetPerformanceMarkBytesData/GetPerformanceMarkBytesData.ts'
import { getPerformanceMarkCountsData } from '../src/parts/GetPerformanceMarkCountsData/GetPerformanceMarkCountsData.ts'

test.each([
  {
    chart: CreatePerformanceMarkCountsChart,
    expected: { count: 696, delta: 8, name: 'PerformanceMark' },
    getData: getPerformanceMarkCountsData,
    key: 'performanceMarkCounts',
    name: 'performance-mark-counts',
    value: { after: 696, before: 688 },
  },
  {
    chart: CreatePerformanceMarkBytesChart,
    expected: { count: 89_088, delta: 1_024, name: 'PerformanceMark' },
    getData: getPerformanceMarkBytesData,
    key: 'performanceMarkBytes',
    name: 'performance-mark-bytes',
    value: { after: 89_088, before: 88_064 },
  },
])('$name creates one black/red growth chart per result', async ({ chart, expected, getData, key, name, value }) => {
  const workspaceRoot = await mkdtemp(join(tmpdir(), 'performance-mark-chart-'))
  const basePath = join(workspaceRoot, '.vscode-memory-leak-finder-results')
  const resultsPath = join(basePath, name)
  await mkdir(resultsPath, { recursive: true })
  await writeFile(join(resultsPath, 'editor-open.json'), JSON.stringify({ [key]: value }))

  try {
    await expect(getData(basePath)).resolves.toEqual([
      {
        data: [expected],
        filename: 'editor-open',
      },
    ])
    expect(chart.multiple).toBe(true)
    expect(chart.name).toBe(name)
    expect(chart.createChart().type).toBe('dual-bar-chart')
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true })
  }
})

test('exports both PerformanceMark charts', () => {
  expect(Charts.PerformanceMarkCounts).toBe(CreatePerformanceMarkCountsChart)
  expect(Charts.PerformanceMarkBytes).toBe(CreatePerformanceMarkBytesChart)
})
