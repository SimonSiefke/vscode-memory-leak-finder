import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@jest/globals'
import * as Charts from '../src/parts/Charts/Charts.ts'
import * as chart from '../src/parts/CreateObjectShapeCountChart/CreateObjectShapeCountChart.ts'

test('object-shape-count reads after counts and is registered for the main page', async () => {
  const root = await mkdtemp(join(tmpdir(), 'object-shape-count-'))
  try {
    expect(await chart.getData(root)).toEqual([])
    const folder = join(root, 'object-shape-count')
    await mkdir(folder)
    await writeFile(join(folder, 'editor-open.json'), JSON.stringify({ objectShapeCount: { before: 7, after: 12 } }))
    await writeFile(join(folder, 'settings-open.json'), JSON.stringify({ objectShapeCount: { before: 3, after: 0 } }))

    expect(await chart.getData(root)).toEqual([
      { count: 12, index: 0, name: 'editor-open.json' },
      { count: 0, index: 1, name: 'settings-open.json' },
    ])
    expect(Charts.ObjectShapeCount).toBe(chart)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
