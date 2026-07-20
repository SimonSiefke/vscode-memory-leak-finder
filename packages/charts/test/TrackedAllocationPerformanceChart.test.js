import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@jest/globals'
import * as CreateTrackedAllocationPerformanceChart from '../src/parts/CreateTrackedAllocationPerformanceChart/CreateTrackedAllocationPerformanceChart.ts'
import { getTrackedAllocationPerformanceData } from '../src/parts/GetTrackedAllocationPerformanceData/GetTrackedAllocationPerformanceData.ts'

test('getTrackedAllocationPerformanceData returns allocation and CPU correlation by source file', async () => {
  const workspaceRoot = await mkdtemp(join(tmpdir(), 'tracked-allocation-performance-data-'))
  const basePath = join(workspaceRoot, '.vscode-memory-leak-finder-results')
  const resultsPath = join(basePath, 'tracked-allocation-performance')
  await mkdir(resultsPath, { recursive: true })
  await writeFile(
    join(resultsPath, 'editor-type.json'),
    JSON.stringify({
      trackedAllocationPerformance: {
        files: [
          {
            collectedCount: 3,
            createdCount: 5,
            retainedCount: 2,
            source: 'src/a.ts',
            sourceSelfTimeMs: 4,
            sourceSelfTimePercent: 40,
          },
          {
            collectedCount: 8,
            createdCount: 8,
            retainedCount: 0,
            source: 'src/b.ts',
            sourceSelfTimeMs: 2,
            sourceSelfTimePercent: 20,
          },
        ],
      },
    }),
  )

  try {
    expect(await getTrackedAllocationPerformanceData(basePath)).toEqual([
      {
        data: [
          {
            collectedCount: 8,
            createdCount: 8,
            name: 'src/b.ts',
            retainedCount: 0,
            sourceSelfTimeMs: 2,
            sourceSelfTimePercent: 20,
          },
          {
            collectedCount: 3,
            createdCount: 5,
            name: 'src/a.ts',
            retainedCount: 2,
            sourceSelfTimeMs: 4,
            sourceSelfTimePercent: 40,
          },
        ],
        filename: 'editor-type',
        omittedEntryCount: 0,
      },
    ])
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true })
  }
})

test('getTrackedAllocationPerformanceData limits chart rows', async () => {
  const workspaceRoot = await mkdtemp(join(tmpdir(), 'tracked-allocation-performance-limit-'))
  const basePath = join(workspaceRoot, '.vscode-memory-leak-finder-results')
  const resultsPath = join(basePath, 'tracked-allocation-performance')
  await mkdir(resultsPath, { recursive: true })
  await writeFile(
    join(resultsPath, 'editor-type.json'),
    JSON.stringify({
      trackedAllocationPerformance: {
        files: Array.from({ length: 104 }, (_, index) => ({
          collectedCount: index,
          createdCount: index + 1,
          source: `src/${index}.ts`,
        })),
      },
    }),
  )

  try {
    const result = await getTrackedAllocationPerformanceData(basePath)
    expect(result[0].data).toHaveLength(100)
    expect(result[0].omittedEntryCount).toBe(4)
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true })
  }
})

test('createTrackedAllocationPerformanceChart uses the combined allocation and CPU chart', () => {
  expect(CreateTrackedAllocationPerformanceChart.name).toBe('tracked-allocation-performance')
  expect(CreateTrackedAllocationPerformanceChart.multiple).toBe(true)
  expect(CreateTrackedAllocationPerformanceChart.createChart()).toEqual(
    expect.objectContaining({
      type: 'allocation-performance-chart',
      width: 1600,
    }),
  )
})
