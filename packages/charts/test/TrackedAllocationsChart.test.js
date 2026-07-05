import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@jest/globals'
import * as CreateTrackedAllocationsByFileChart from '../src/parts/CreateTrackedAllocationsByFileChart/CreateTrackedAllocationsByFileChart.ts'
import * as CreateTrackedAllocationsChart from '../src/parts/CreateTrackedAllocationsChart/CreateTrackedAllocationsChart.ts'
import { getTrackedAllocationsByFileData } from '../src/parts/GetTrackedAllocationsByFileData/GetTrackedAllocationsByFileData.ts'
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
        omittedEntryCount: 0,
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

test('getTrackedAllocationsByFileData returns created and collected counts grouped by source file', async () => {
  const workspaceRoot = await mkdtemp(join(tmpdir(), 'tracked-allocations-by-file-data-'))
  const basePath = join(workspaceRoot, '.vscode-memory-leak-finder-results')
  const resultsPath = join(basePath, 'tracked-allocations')

  await mkdir(resultsPath, { recursive: true })
  await writeFile(
    join(resultsPath, 'editor-open.json'),
    JSON.stringify({
      trackedAllocations: [
        { collectedCount: 2, createdCount: 5, originalSource: 'src/a.ts' },
        { collectedCount: 4, createdCount: 6, originalSource: 'src/a.ts' },
        { collectedCount: 3, createdCount: 8, originalLocation: 'src/b.ts:10:2' },
        { collectedCount: 9, createdCount: 8, location: '1:2:3' },
        { collectedCount: 0, createdCount: 1 },
      ],
    }),
  )

  try {
    const result = await getTrackedAllocationsByFileData(basePath)

    expect(result).toEqual([
      {
        data: [
          { collected: 6, created: 11, name: 'src/a.ts' },
          { collected: 9, created: 8, name: '1:2:3' },
          { collected: 3, created: 8, name: 'src/b.ts:10:2' },
          { collected: 0, created: 1, name: 'Unknown' },
        ],
        filename: 'editor-open',
        omittedEntryCount: 0,
      },
    ])
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true })
  }
})

test('getTrackedAllocationsData limits chart rows and records omitted entries', async () => {
  const workspaceRoot = await mkdtemp(join(tmpdir(), 'tracked-allocations-data-limit-'))
  const basePath = join(workspaceRoot, '.vscode-memory-leak-finder-results')
  const resultsPath = join(basePath, 'tracked-allocations')
  const trackedAllocations = Array.from({ length: 105 }, (_, index) => ({
    collectedCount: index,
    createdCount: index + 1,
    location: `1:${index}:1`,
    type: 'Object',
  }))

  await mkdir(resultsPath, { recursive: true })
  await writeFile(join(resultsPath, 'chat.json'), JSON.stringify(trackedAllocations))

  try {
    const result = await getTrackedAllocationsData(basePath)

    expect(result[0].data).toHaveLength(100)
    expect(result[0].data[0]).toEqual({ count: 105, delta: 104, name: 'Object 1:104:1' })
    expect(result[0].omittedEntryCount).toBe(5)
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true })
  }
})

test('getTrackedAllocationsByFileData limits chart rows and records omitted entries', async () => {
  const workspaceRoot = await mkdtemp(join(tmpdir(), 'tracked-allocations-by-file-data-limit-'))
  const basePath = join(workspaceRoot, '.vscode-memory-leak-finder-results')
  const resultsPath = join(basePath, 'tracked-allocations')
  const trackedAllocations = Array.from({ length: 103 }, (_, index) => ({
    collectedCount: index,
    createdCount: index + 1,
    originalSource: `src/${index}.ts`,
  }))

  await mkdir(resultsPath, { recursive: true })
  await writeFile(join(resultsPath, 'editor-open.json'), JSON.stringify({ trackedAllocations }))

  try {
    const result = await getTrackedAllocationsByFileData(basePath)

    expect(result[0].data).toHaveLength(100)
    expect(result[0].data[0]).toEqual({ collected: 102, created: 103, name: 'src/102.ts' })
    expect(result[0].omittedEntryCount).toBe(3)
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true })
  }
})

test('createTrackedAllocationsByFileChart uses grouped horizontal bar chart configuration', () => {
  expect(CreateTrackedAllocationsByFileChart.name).toBe('tracked-allocations-by-file')
  expect(CreateTrackedAllocationsByFileChart.multiple).toBe(true)
  expect(CreateTrackedAllocationsByFileChart.createChart()).toEqual(
    expect.objectContaining({
      type: 'grouped-horizontal-bar-chart',
      yLabel: 'Source File',
    }),
  )
})
