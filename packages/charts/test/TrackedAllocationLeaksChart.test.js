import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@jest/globals'
import * as CreateTrackedAllocationLeaksChart from '../src/parts/CreateTrackedAllocationLeaksChart/CreateTrackedAllocationLeaksChart.ts'
import { getTrackedAllocationLeaksData } from '../src/parts/GetTrackedAllocationLeaksData/GetTrackedAllocationLeaksData.ts'

test('getTrackedAllocationLeaksData returns retained allocations ordered by alive count', async () => {
  const workspaceRoot = await mkdtemp(join(tmpdir(), 'tracked-allocation-leaks-data-'))
  const basePath = join(workspaceRoot, '.vscode-memory-leak-finder-results')
  const resultsPath = join(basePath, 'tracked-allocation-leaks')
  await mkdir(resultsPath, { recursive: true })
  await writeFile(
    join(resultsPath, 'editor-open.json'),
    JSON.stringify({
      trackedAllocationLeaks: [
        {
          aliveCount: 2,
          createdCount: 5,
          originalLocation: 'src/a.ts:2:3',
          type: 'Array',
        },
        {
          aliveCount: 0,
          createdCount: 8,
          location: '1:4:5',
          type: 'Object',
        },
        {
          aliveCount: 4,
          createdCount: 6,
          location: '1:6:7',
          type: 'Map',
        },
      ],
    }),
  )

  try {
    expect(await getTrackedAllocationLeaksData(basePath)).toEqual([
      {
        data: [
          { count: 6, delta: 4, name: 'Map 1:6:7' },
          { count: 5, delta: 2, name: 'Array src/a.ts:2:3' },
        ],
        filename: 'editor-open',
        omittedEntryCount: 0,
      },
    ])
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true })
  }
})

test('getTrackedAllocationLeaksData limits chart rows', async () => {
  const workspaceRoot = await mkdtemp(join(tmpdir(), 'tracked-allocation-leaks-limit-'))
  const basePath = join(workspaceRoot, '.vscode-memory-leak-finder-results')
  const resultsPath = join(basePath, 'tracked-allocation-leaks')
  await mkdir(resultsPath, { recursive: true })
  await writeFile(
    join(resultsPath, 'editor-open.json'),
    JSON.stringify({
      trackedAllocationLeaks: Array.from({ length: 103 }, (_, index) => ({
        aliveCount: index + 1,
        createdCount: index + 2,
        location: `1:${index}:1`,
        type: 'Object',
      })),
    }),
  )

  try {
    const result = await getTrackedAllocationLeaksData(basePath)
    expect(result[0].data).toHaveLength(100)
    expect(result[0].omittedEntryCount).toBe(3)
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true })
  }
})

test('createTrackedAllocationLeaksChart uses retained dual bars', () => {
  expect(CreateTrackedAllocationLeaksChart.name).toBe('tracked-allocation-leaks')
  expect(CreateTrackedAllocationLeaksChart.multiple).toBe(true)
  expect(CreateTrackedAllocationLeaksChart.createChart()).toEqual(
    expect.objectContaining({
      type: 'dual-bar-chart',
      yLabel: 'Potential Leak Site',
    }),
  )
})
