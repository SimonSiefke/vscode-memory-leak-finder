import { expect, test } from '@jest/globals'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as Chart from '../src/parts/CreateStringsWithLocationsChart/CreateStringsWithLocationsChart.ts'
import * as Charts from '../src/parts/Charts/Charts.ts'

test('registers the strings-with-locations chart', () => {
  expect(Charts.StringsWithLocations).toBe(Chart)
  expect(Chart.name).toBe('strings-with-locations')
  expect(Chart.multiple).toBe(true)
  expect(Chart.createChart()).toMatchObject({ type: 'dual-bar-chart', yLabel: 'Added String Objects by Retaining Location' })
})

test('shows added counts in descending order with stable text/location identities', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'strings-with-locations-chart-'))
  try {
    expect(await Chart.getData(directory)).toEqual([])
    const results = join(directory, 'strings-with-locations')
    await mkdir(results)
    await writeFile(
      join(results, 'output.json'),
      JSON.stringify({
        stringsWithLocations: [
          { string: 'output', location: 'src/owner.ts:42:7', count: 2 },
          { string: 'output', location: 'src/other.ts:5:1', count: 10 },
          { string: null, location: null, count: 1, stringType: 'sliced string', heapObjectId: '11' },
          { string: 'x'.repeat(150), location: null, count: 1 },
        ],
      }),
    )
    const result = await Chart.getData(directory)
    expect(result[0].filename).toBe('output')
    expect(result[0].data.map((item) => item.count)).toEqual([10, 2, 1, 1])
    expect(result[0].data[0]).toMatchObject({ name: '"output" (src/other.ts:5:1)', delta: 10 })
    expect(new Set(result[0].data.map((item) => item.comparisonKey)).size).toBe(4)
    expect(result[0].data.some((item) => item.name.includes('[sliced string #11] (unknown location)'))).toBe(true)
    expect(result[0].data.some((item) => item.name.includes('…'))).toBe(true)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
