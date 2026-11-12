import { expect, test } from '@jest/globals'
import { mkdtemp, mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as Root from '../src/parts/Root/Root.ts'
import { cleanMapAndSetSizeCharts, getMapAndSetSizeChartPath } from '../src/parts/GenerateCharts/GenerateCharts.ts'

test('writes Map and Set size charts into the overview directory', () => {
  expect(getMapAndSetSizeChartPath('main', 'map-size', 'before-after')).toBe(
    join(Root.root, '.vscode-charts', 'main-map-size-before-after.svg'),
  )
  expect(getMapAndSetSizeChartPath('node', 'set-size', 'decreasing-count')).toBe(
    join(Root.root, '.vscode-charts', 'node-set-size-decreasing-count.svg'),
  )
})

test('removes stale dedicated pages and Map/Set overview charts before regeneration', async () => {
  const chartsRoot = await mkdtemp(join(tmpdir(), 'map-and-set-size-charts-'))
  try {
    await mkdir(join(chartsRoot, 'map-and-set-size'))
    await writeFile(join(chartsRoot, 'map-and-set-size', 'index.html'), 'old page')
    await writeFile(join(chartsRoot, 'main-map-size-removed-scenario.svg'), 'old map chart')
    await writeFile(join(chartsRoot, 'node-set-size-removed-scenario.svg'), 'old set chart')
    await writeFile(join(chartsRoot, 'main-heap-size.svg'), 'unrelated chart')

    await cleanMapAndSetSizeCharts(chartsRoot)

    await expect(readdir(join(chartsRoot, 'map-and-set-size'))).rejects.toMatchObject({ code: 'ENOENT' })
    await expect(readdir(chartsRoot)).resolves.toEqual(['main-heap-size.svg'])
  } finally {
    await rm(chartsRoot, { recursive: true, force: true })
  }
})
