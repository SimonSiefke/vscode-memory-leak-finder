import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@jest/globals'
import * as Charts from '../src/parts/Charts/Charts.ts'
import * as Chart from '../src/parts/CreateArrayBufferBytesChart/CreateArrayBufferBytesChart.ts'

test('registers per-scenario backing-store charts', () => {
  expect(Charts.ArrayBufferBytes).toBe(Chart)
  expect(Chart.multiple).toBe(true)
  expect(Chart.createChart()).toMatchObject({ type: 'bar-chart' })
})

test('shows both byte and store counts without mixing units', async () => {
  const root = await mkdtemp(join(tmpdir(), 'buffer-bytes-chart-'))
  try {
    await expect(Chart.getData(root)).resolves.toEqual([])
    const results = join(root, 'arrayBufferBytes')
    await mkdir(join(results, 'ignored'), { recursive: true })
    await writeFile(join(results, 'ignored.log'), 'not JSON')
    await writeFile(
      join(results, 'semantic.json'),
      JSON.stringify({
        arrayBufferBytes: {
          before: { bytes: 157029, backingStoreCount: 43 },
          after: { bytes: 899274, backingStoreCount: 82 },
          delta: { bytes: 742245, backingStoreCount: 39 },
          isLeak: true,
        },
        isLeak: true,
      }),
    )
    await expect(Chart.getData(root)).resolves.toEqual([
      {
        filename: 'semantic-bytes',
        data: [
          { name: 'Before iterations (bytes)', value: 157029 },
          { name: 'After iterations (bytes)', value: 899274 },
        ],
      },
      {
        filename: 'semantic-stores',
        data: [
          { name: 'Before iterations (stores)', value: 43 },
          { name: 'After iterations (stores)', value: 82 },
        ],
      },
    ])
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('preserves zero and decreasing measurements', async () => {
  const root = await mkdtemp(join(tmpdir(), 'buffer-bytes-chart-'))
  try {
    await mkdir(join(root, 'arrayBufferBytes'))
    await writeFile(
      join(root, 'arrayBufferBytes', 'cleanup.json'),
      JSON.stringify({ arrayBufferBytes: { before: { bytes: 20000, backingStoreCount: 1 }, after: { bytes: 0, backingStoreCount: 0 } } }),
    )
    const charts = await Chart.getData(root)
    expect(charts.map((chart) => chart.data.map((row) => row.value))).toEqual([
      [20000, 0],
      [1, 0],
    ])
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test.each(['bytes', 'backingStoreCount'])('rejects missing %s rather than plotting zero', async (field) => {
  const root = await mkdtemp(join(tmpdir(), 'buffer-bytes-chart-'))
  try {
    await mkdir(join(root, 'arrayBufferBytes'))
    const before: Record<string, number> = { bytes: 100, backingStoreCount: 1 }
    delete before[field]
    await writeFile(
      join(root, 'arrayBufferBytes', 'incomplete.json'),
      JSON.stringify({ arrayBufferBytes: { before, after: { bytes: 100, backingStoreCount: 1 } } }),
    )
    await expect(Chart.getData(root)).rejects.toThrow(`Missing finite before/after ${field} in incomplete.json`)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
