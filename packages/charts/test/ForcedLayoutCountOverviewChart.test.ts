import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@jest/globals'
import * as Charts from '../src/parts/Charts/Charts.ts'
import * as chart from '../src/parts/CreateForcedLayoutCountOverviewChart/CreateForcedLayoutCountOverviewChart.ts'

test('main-page overview includes only complete layout counts, including zero', async () => {
  const root = await mkdtemp(join(tmpdir(), 'forced-layout-overview-'))
  try {
    expect(await chart.getData(root)).toEqual([])
    const folder = join(root, 'forced-layout-count')
    await mkdir(folder)
    const results = {
      'b-zero': { metrics: { forcedLayoutCount: 0 } },
      'a-layout': { metrics: { forcedLayoutCount: 3, forcedStyleCount: 20, forcedLayoutDurationMs: 12 } },
      'c-unavailable': { available: false, metrics: { forcedLayoutCount: 5 } },
      'd-incomplete': { incomplete: true, metrics: { forcedLayoutCount: 9 } },
      'e-missing': { metrics: {} },
      'f-invalid': { metrics: { forcedLayoutCount: '4' } },
      'g-negative': { metrics: { forcedLayoutCount: -1 } },
    }
    for (const [name, result] of Object.entries(results)) {
      await writeFile(join(folder, `${name}.json`), JSON.stringify({ forcedLayoutCount: result }))
    }
    await writeFile(join(folder, 'notes.txt'), 'not a result')

    expect(await chart.getData(root)).toEqual([
      { count: 3, index: 0, name: 'a-layout.json' },
      { count: 0, index: 1, name: 'b-zero.json' },
    ])
    expect(Charts.ForcedLayoutCountOverview).toBe(chart)
    expect(Charts.ForcedLayoutCount.multiple).toBe(true)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
