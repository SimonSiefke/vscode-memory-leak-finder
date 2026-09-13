import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@jest/globals'
import * as Charts from '../src/parts/Charts/Charts.ts'
import * as Chart from '../src/parts/CreateNamedArrayCountDifferenceChart/CreateNamedArrayCountDifferenceChart.ts'

test('registers a per-scenario array count and delta chart', () => {
  expect(Charts.NamedArrayCountDifference).toBe(Chart)
  expect(Chart.multiple).toBe(true)
  expect(Chart.name).toBe('named-array-count-difference')
  expect(Chart.createChart()).toMatchObject({ type: 'dual-bar-chart', yLabel: 'Array Counts' })
})

test('preserves all rows, sorts counts, and keeps empty results empty', async () => {
  const root = await mkdtemp(join(tmpdir(), 'named-array-chart-'))
  const resultsPath = join(root, 'namedArrayCountDifference')
  try {
    await expect(Chart.getData(root)).resolves.toEqual([])
    await mkdir(join(resultsPath, 'unrelated-directory'), { recursive: true })
    await writeFile(join(resultsPath, 'unrelated.log'), 'not JSON')
    await writeFile(
      join(resultsPath, 'before.json'),
      JSON.stringify({
        namedArrayCountDifference: [
          { name: 'tabs', count: 38, delta: 37 },
          { name: 'listeners', count: 50, delta: 1 },
        ],
      }),
    )
    await writeFile(join(resultsPath, 'after.json'), JSON.stringify({ namedArrayCountDifference: [] }))
    await expect(Chart.getData(root)).resolves.toEqual([
      { data: [], filename: 'after' },
      {
        data: [
          { name: 'listeners', count: 50, delta: 1 },
          { name: 'tabs', count: 38, delta: 37 },
        ],
        filename: 'before',
      },
    ])
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
