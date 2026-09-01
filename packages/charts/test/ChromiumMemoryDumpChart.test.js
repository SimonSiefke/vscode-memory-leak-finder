import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@jest/globals'
import * as CreateChromiumMemoryDumpAllocatorsChart from '../src/parts/CreateChromiumMemoryDumpAllocatorsChart/CreateChromiumMemoryDumpAllocatorsChart.ts'
import * as CreateChromiumMemoryDumpProcessesChart from '../src/parts/CreateChromiumMemoryDumpProcessesChart/CreateChromiumMemoryDumpProcessesChart.ts'
import {
  getChromiumMemoryDumpAllocatorData,
  getChromiumMemoryDumpProcessData,
} from '../src/parts/GetChromiumMemoryDumpData/GetChromiumMemoryDumpData.ts'

/**
 * @param {any} value
 * @param {(basePath: string) => Promise<void>} fn
 */
const withFixture = async (value, fn) => {
  const workspaceRoot = await mkdtemp(join(tmpdir(), 'chromium-memory-dump-data-'))
  const basePath = join(workspaceRoot, '.vscode-memory-leak-finder-results')
  const resultsPath = join(basePath, 'chromium-memory-dump')
  await mkdir(resultsPath, { recursive: true })
  await writeFile(join(resultsPath, 'base.json'), JSON.stringify({ chromiumMemoryDump: value }))
  try {
    await fn(basePath)
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true })
  }
}

test('process chart data includes growth, shrinkage, inspected renderer, and process lifecycle rows', async () => {
  await withFixture(
    {
      complete: true,
      processes: [
        {
          after: { peakResidentSetBytes: 300, privateFootprintBytes: 180 },
          before: { peakResidentSetBytes: 200, privateFootprintBytes: 100 },
          isInspected: true,
          name: 'Renderer',
          pid: 12,
        },
        {
          after: { peakResidentSetBytes: 500, privateFootprintBytes: 200 },
          before: { peakResidentSetBytes: 600, privateFootprintBytes: 350 },
          name: 'Browser',
          pid: 5,
        },
        { after: null, before: { privateFootprintBytes: 20 }, name: 'Gone', pid: 99 },
      ],
      supported: true,
    },
    async (basePath) => {
      expect(await getChromiumMemoryDumpProcessData(basePath)).toEqual([
        {
          data: [
            expect.objectContaining({ afterBytes: 200, beforeBytes: 350, deltaBytes: -150, name: 'Browser (PID 5)' }),
            expect.objectContaining({ afterBytes: 180, beforeBytes: 100, deltaBytes: 80, isInspected: true, name: 'Renderer (PID 12)' }),
            expect.objectContaining({ afterBytes: 0, beforeBytes: 20, deltaBytes: -20, name: 'Gone (PID 99)' }),
          ],
          filename: 'base',
          omittedEntryCount: 0,
        },
      ])
    },
  )
})

test('allocator chart data uses selected bytes, limits rows to 40, and counts omissions', async () => {
  /** @type {any[]} */
  const allocators = Array.from({ length: 42 }, (_, index) => ({
    deltaBytes: index - 20,
    metric: index % 2 ? 'effective_size' : 'size',
    path: `v8/path-${index}`,
    pid: 12,
    processName: 'Renderer',
    selectedAfterBytes: 100 + index,
    selectedBeforeBytes: 120,
  }))
  allocators.push({ path: 'missing', pid: 12, processName: 'Renderer' })
  await withFixture({ allocators, complete: true, supported: true }, async (basePath) => {
    const [result] = await getChromiumMemoryDumpAllocatorData(basePath)

    expect(result.data).toHaveLength(40)
    expect(result.omittedEntryCount).toBe(3)
    expect(result.data[0]).toMatchObject({ deltaBytes: 21, name: 'Renderer (PID 12) — v8/path-41' })
    expect(result.data[0].detail).toContain('effective_size')
  })
})

test('unsupported and incomplete results are skipped', async () => {
  await withFixture({ complete: false, supported: true }, async (basePath) => {
    expect(await getChromiumMemoryDumpProcessData(basePath)).toEqual([])
    expect(await getChromiumMemoryDumpAllocatorData(basePath)).toEqual([])
  })
})

test('Chromium dump chart visitors use the shared comparison renderer', () => {
  expect(CreateChromiumMemoryDumpProcessesChart).toMatchObject({ multiple: true, name: 'chromium-memory-dump-processes' })
  expect(CreateChromiumMemoryDumpProcessesChart.createChart()).toMatchObject({ type: 'memory-comparison-chart' })
  expect(CreateChromiumMemoryDumpAllocatorsChart).toMatchObject({ multiple: true, name: 'chromium-memory-dump-allocators' })
  expect(CreateChromiumMemoryDumpAllocatorsChart.createChart().subtitle).toContain('not additive')
})
