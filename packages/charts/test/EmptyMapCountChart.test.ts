import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@jest/globals'
import * as Charts from '../src/parts/Charts/Charts.ts'
import * as chart from '../src/parts/CreateEmptyMapCountChart/CreateEmptyMapCountChart.ts'

test('empty-map-count reads counts, including zero, and is registered for the main page', async () => {
  const root = await mkdtemp(join(tmpdir(), 'empty-map-count-'))
  try {
    expect(await chart.getData(root)).toEqual([])
    const folder = join(root, 'empty-map-count')
    await mkdir(folder)
    await writeFile(join(folder, 'editor-open.json'), JSON.stringify({ emptyMapCount: { before: 7, after: 12 } }))
    await writeFile(join(folder, 'settings-open.json'), JSON.stringify({ emptyMapCount: { before: 3, after: 0 } }))
    expect(await chart.getData(root)).toEqual([
      { count: 12, index: 0, name: 'editor-open.json' },
      { count: 0, index: 1, name: 'settings-open.json' },
    ])
    expect(Charts.EmptyMapCount).toBe(chart)
    expect(chart.createChart().yLabel).toBe('Empty Map Count')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
