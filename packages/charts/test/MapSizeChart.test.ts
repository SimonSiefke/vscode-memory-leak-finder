import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@jest/globals'
import * as Charts from '../src/parts/Charts/Charts.ts'
import * as Chart from '../src/parts/CreateMapSizeChart/CreateMapSizeChart.ts'

test('registers visible per-scenario map size bars', () => {
  expect(Charts.MapSize).toBe(Chart)
  expect(Chart.multiple).toBe(true)
  expect(Chart.createChart()).toMatchObject({ type: 'bar-chart' })
})

test.each(['mapSize', 'map-size'])('reads both snapshots from %s, including zero and decreasing counts', async (directory) => {
  const root = await mkdtemp(join(tmpdir(), 'map-size-chart-'))
  try {
    await expect(Chart.getData(root)).resolves.toEqual([])
    const results = join(root, directory)
    await mkdir(join(results, 'ignored'), { recursive: true })
    await writeFile(join(results, 'ignored.log'), 'not JSON')
    await writeFile(join(results, 'favicon.json'), JSON.stringify({ mapSize: { before: 873, after: 916 } }))
    await writeFile(join(results, 'cleanup.json'), JSON.stringify({ mapSize: { before: 3, after: 0 } }))
    await expect(Chart.getData(root)).resolves.toEqual([
      {
        filename: 'cleanup',
        data: [
          { name: 'Before iterations', value: 3 },
          { name: 'After iterations', value: 0 },
        ],
      },
      {
        filename: 'favicon',
        data: [
          { name: 'Before iterations', value: 873 },
          { name: 'After iterations', value: 916 },
        ],
      },
    ])
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('does not silently plot missing snapshot data as zero', async () => {
  const root = await mkdtemp(join(tmpdir(), 'map-size-chart-'))
  try {
    await mkdir(join(root, 'mapSize'))
    await writeFile(join(root, 'mapSize', 'incomplete.json'), JSON.stringify({ mapSize: { after: 10 } }))
    await expect(Chart.getData(root)).rejects.toThrow('Missing finite before/after map sizes in incomplete.json')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
