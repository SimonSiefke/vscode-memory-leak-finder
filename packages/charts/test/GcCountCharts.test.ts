import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@jest/globals'
import * as Charts from '../src/parts/Charts/Charts.ts'
import * as minor from '../src/parts/CreateMinorGcCountChart/CreateMinorGcCountChart.ts'
import * as major from '../src/parts/CreateMajorGcCountChart/CreateMajorGcCountChart.ts'

test('main-page GC charts read separate event counts and omit lost or missing data', async () => {
  const root = await mkdtemp(join(tmpdir(), 'gc-count-charts-'))
  try {
    expect(await minor.getData(root)).toEqual([])
    expect(await major.getData(root)).toEqual([])
    const folder = join(root, 'gc-statistics')
    await mkdir(folder)
    const results = {
      'b-zero': { metrics: { minorGCs: 0, majorGCs: 0 } },
      'a-collections': { metrics: { minorGCs: 8, majorGCs: 2, gcDurationMs: 50, garbageMB: 64, usedHeapMB: 128 } },
      'c-lost': { metrics: { minorGCs: 3, majorGCs: 1 }, raw: { after: { dataLossOccurred: true } } },
      'd-missing': { metrics: { usedHeapMB: 256 } },
      'e-invalid': { metrics: { minorGCs: '8', majorGCs: -1 } },
    }
    for (const [name, result] of Object.entries(results)) {
      await writeFile(join(folder, `${name}.json`), JSON.stringify({ gcStatistics: result }))
    }
    await writeFile(join(folder, 'notes.txt'), 'not a result')

    expect(await minor.getData(root)).toEqual([
      { count: 8, index: 0, name: 'a-collections.json' },
      { count: 0, index: 1, name: 'b-zero.json' },
    ])
    expect(await major.getData(root)).toEqual([
      { count: 2, index: 0, name: 'a-collections.json' },
      { count: 0, index: 1, name: 'b-zero.json' },
    ])
    expect(Charts.MinorGcCount).toBe(minor)
    expect(Charts.MajorGcCount).toBe(major)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
