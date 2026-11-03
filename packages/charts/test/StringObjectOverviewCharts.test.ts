import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@jest/globals'
import * as Charts from '../src/parts/Charts/Charts.ts'
import * as Bytes from '../src/parts/CreateStringObjectBytesOverviewChart/CreateStringObjectBytesOverviewChart.ts'
import * as Count from '../src/parts/CreateStringObjectCountOverviewChart/CreateStringObjectCountOverviewChart.ts'

test.each([
  { chart: Count, key: 'stringObjectCount', label: 'String Object Count' },
  { chart: Bytes, key: 'stringObjectBytes', label: 'String Object Size (bytes)' },
])('$key plots absolute after-test totals in test case order, including decreases and zero', async ({ chart, key, label }) => {
  const directory = await mkdtemp(join(tmpdir(), 'string-overview-'))
  try {
    expect(await chart.getData(directory)).toEqual([])
    const results = join(directory, chart.name)
    await mkdir(results)
    // Create files out of order to verify the same ordered sequence as object-count.
    await writeFile(join(results, 'c.json'), JSON.stringify({ [key]: { before: 50, after: 0 } }))
    await writeFile(join(results, 'a.json'), JSON.stringify({ [key]: { before: 95, after: 100 } }))
    await writeFile(join(results, 'b.json'), JSON.stringify({ [key]: { before: 200, after: 180 } }))
    expect(await chart.getData(directory)).toEqual([
      { count: 100, index: 0, name: 'a.json' },
      { count: 180, index: 1, name: 'b.json' },
      { count: 0, index: 2, name: 'c.json' },
    ])
    expect('multiple' in chart).toBe(false)
    expect(chart.createChart()).toEqual({
      ...(key === 'stringObjectBytes' ? { marginLeft: 90 } : {}),
      x: 'index',
      xLabel: 'Test Case Index',
      y: 'count',
      yLabel: label,
    })
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('registers homepage overviews alongside the existing per-test bars', () => {
  expect(Charts.StringObjectCountOverview).toBe(Count)
  expect(Charts.StringObjectBytesOverview).toBe(Bytes)
  expect(Count.name).toBe(Charts.StringObjectCount.name)
  expect(Bytes.name).toBe(Charts.StringObjectBytes.name)
  expect(Charts.StringObjectCount.multiple).toBe(true)
  expect(Charts.StringObjectBytes.multiple).toBe(true)
})
