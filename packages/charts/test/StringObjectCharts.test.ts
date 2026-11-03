import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@jest/globals'
import * as Charts from '../src/parts/Charts/Charts.ts'
import * as Bytes from '../src/parts/CreateStringObjectBytesChart/CreateStringObjectBytesChart.ts'
import * as Count from '../src/parts/CreateStringObjectCountChart/CreateStringObjectCountChart.ts'

const charts = [
  { chart: Count, key: 'stringObjectCount', label: 'String Object Count' },
  { chart: Bytes, key: 'stringObjectBytes', label: 'String Object Bytes' },
]

test.each(charts)('$key reads baseline, growth, unchanged, and decreasing results', async ({ chart, key, label }) => {
  const directory = await mkdtemp(join(tmpdir(), 'string-object-charts-'))
  try {
    await expect(chart.getData(directory)).resolves.toEqual([])
    const results = join(directory, chart.name)
    await mkdir(results)
    await writeFile(join(results, 'growth.json'), JSON.stringify({ [key]: { before: 100, after: 140 } }))
    await writeFile(join(results, 'unchanged.json'), JSON.stringify({ [key]: { before: 100, after: 100 } }))
    await writeFile(join(results, 'decrease.json'), JSON.stringify({ [key]: { before: 100, after: 80 } }))
    expect(await chart.getData(directory)).toEqual(
      expect.arrayContaining([
        { data: [{ count: 140, delta: 40, name: 'String objects' }], filename: 'growth' },
        { data: [{ count: 100, delta: 0, name: 'String objects' }], filename: 'unchanged' },
        { data: [{ count: 80, delta: -20, name: 'String objects' }], filename: 'decrease' },
      ]),
    )
    expect(chart.multiple).toBe(true)
    expect(chart.createChart()).toMatchObject({ type: 'dual-bar-chart', yLabel: label })
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('registers both string object charts', () => {
  expect(Charts.StringObjectBytes).toBe(Bytes)
  expect(Charts.StringObjectCount).toBe(Count)
  expect(Count.name).toBe('string-object-count')
  expect(Bytes.name).toBe('string-object-bytes')
})
