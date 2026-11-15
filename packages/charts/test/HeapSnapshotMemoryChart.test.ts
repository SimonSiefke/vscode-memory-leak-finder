import { expect, test } from '@jest/globals'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as CreateHeapSnapshotMemoryChart from '../src/parts/CreateHeapSnapshotMemoryChart/CreateHeapSnapshotMemoryChart.ts'
import { getHeapSnapshotMemoryData } from '../src/parts/GetHeapSnapshotMemoryData/GetHeapSnapshotMemoryData.ts'

test('getHeapSnapshotMemoryData returns renderer heap bytes over scenario runs', async () => {
  const workspaceRoot = await mkdtemp(join(tmpdir(), 'heap-snapshot-memory-data-'))
  const resultsPath = join(workspaceRoot, 'heapSnapshotBytes')
  await mkdir(resultsPath, { recursive: true })
  await writeFile(
    join(resultsPath, 'window-open-new.json'),
    JSON.stringify({
      heapSnapshotBytes: {
        samples: [
          { runIndex: 2, metrics: { heapBytes: 120, compiledCodeBytes: 20 } },
          { runIndex: 0, metrics: { heapBytes: 90, compiledCodeBytes: 18 } },
          { runIndex: 1, metrics: { heapBytes: 105, compiledCodeBytes: 19 } },
          { runIndex: 3, metrics: { heapBytes: 'invalid' } },
        ],
      },
    }),
  )
  try {
    expect(await getHeapSnapshotMemoryData(workspaceRoot)).toEqual([
      {
        data: [
          { runIndex: 0, value: 90 },
          { runIndex: 1, value: 105 },
          { runIndex: 2, value: 120 },
        ],
        filename: 'window-open-new',
      },
    ])
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true })
  }
})

test('heap snapshot memory chart labels its run axis and byte units', () => {
  expect(CreateHeapSnapshotMemoryChart.name).toBe('heap-snapshot-memory')
  expect(CreateHeapSnapshotMemoryChart.createChart()).toEqual(
    expect.objectContaining({
      type: 'line-chart',
      x: 'runIndex',
      xLabel: 'Scenario run (0 = baseline)',
      yLabel: 'Renderer heap self-size (bytes)',
    }),
  )
})
