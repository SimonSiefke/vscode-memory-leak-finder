import { expect, test } from '@jest/globals'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as Charts from '../src/parts/Charts/Charts.ts'
import * as chart from '../src/parts/CreateHeapSnapshotMemoryOverviewChart/CreateHeapSnapshotMemoryOverviewChart.ts'
import { getFolderContentHtml } from '../src/parts/GenerateIndexHtml/GenerateIndexHtml.ts'

test('homepage overview plots the final valid heap sample in deterministic scenario order', async () => {
  const root = await mkdtemp(join(tmpdir(), 'heap-snapshot-memory-overview-'))
  try {
    expect(await chart.getData(root)).toEqual([])
    const resultsPath = join(root, 'heapSnapshotBytes')
    await mkdir(resultsPath)
    await writeFile(
      join(resultsPath, 'z-invalid.json'),
      JSON.stringify({ heapSnapshotBytes: { samples: [{ runIndex: 0, metrics: { heapBytes: Number.NaN } }] } }),
    )
    await writeFile(
      join(resultsPath, 'b-scenario.json'),
      JSON.stringify({
        heapSnapshotBytes: {
          samples: [
            { runIndex: 2, metrics: { heapBytes: 120 } },
            { runIndex: 0, metrics: { heapBytes: 90 } },
            { runIndex: 1, metrics: { heapBytes: 105 } },
            { runIndex: 3, metrics: { heapBytes: 'invalid' } },
          ],
        },
      }),
    )
    await writeFile(
      join(resultsPath, 'a-scenario.json'),
      JSON.stringify({ heapSnapshotBytes: { samples: [{ runIndex: 0, metrics: { heapBytes: 50 } }] } }),
    )
    await writeFile(join(resultsPath, 'c-missing.json'), JSON.stringify({ heapSnapshotBytes: {} }))

    expect(await chart.getData(root)).toEqual([
      { count: 50, index: 0, name: 'a-scenario.json' },
      { count: 120, index: 1, name: 'b-scenario.json' },
    ])
    expect(chart.createChart()).toEqual({
      marginLeft: 90,
      x: 'index',
      xLabel: 'Scenario Index',
      y: 'count',
      yLabel: 'Renderer heap self-size (bytes)',
    })
    expect(Charts.HeapSnapshotMemoryOverview).toBe(chart)
    expect(Charts.HeapSnapshotMemory.multiple).toBe(true)

    const homepage = getFolderContentHtml('', ['heap-snapshot-memory-overview.svg'])
    expect(homepage).toContain('src="./heap-snapshot-memory-overview.svg"')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
