import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@jest/globals'
import * as CreateTrackedAllocationsChart from '../src/parts/CreateTrackedAllocationsChart/CreateTrackedAllocationsChart.ts'
import { getTrackedAllocationsData } from '../src/parts/GetTrackedAllocationsData/GetTrackedAllocationsData.ts'

test('getTrackedAllocationsData returns allocation churn per test file', async () => {
  const workspaceRoot = await mkdtemp(join(tmpdir(), 'tracked-allocations-data-'))
  const basePath = join(workspaceRoot, '.vscode-memory-leak-finder-results')
  const resultsPath = join(basePath, 'tracked-allocations')

  await mkdir(resultsPath, { recursive: true })
  await writeFile(
    join(resultsPath, 'chat.json'),
    JSON.stringify([
      { collectedCount: 4, createdCount: 5, location: '1:2:3', originalLocation: 'src/a.ts:2:3', type: 'Array' },
      { collectedCount: 8, createdCount: 9, location: '1:4:5', type: 'Object' },
    ]),
  )

  try {
    const result = await getTrackedAllocationsData(basePath)

    expect(result).toEqual([
      {
        data: [
          { count: 9, delta: 8, name: 'Object 1:4:5' },
          { count: 5, delta: 4, name: 'Array src/a.ts:2:3' },
        ],
        filename: 'chat',
      },
    ])
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true })
  }
})

test('createTrackedAllocationsChart uses dual bar chart configuration', () => {
  expect(CreateTrackedAllocationsChart.name).toBe('tracked-allocations')
  expect(CreateTrackedAllocationsChart.multiple).toBe(true)
  expect(CreateTrackedAllocationsChart.createChart()).toEqual(
    expect.objectContaining({
      type: 'dual-bar-chart',
      yLabel: 'Allocation Site',
    }),
  )
})
