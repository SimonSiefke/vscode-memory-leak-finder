import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@jest/globals'
import * as chart from '../src/parts/CreateCpuProfileSummaryChart/CreateCpuProfileSummaryChart.ts'
test('separates units and preserves unavailable runs', async () => {
  const root = await mkdtemp(join(tmpdir(), 'performance-chart-'))
  try {
    expect(await chart.getData(root)).toEqual([])
    const folder = join(root, 'cpu-profile')
    await mkdir(folder)
    await writeFile(
      join(folder, 'run.json'),
      JSON.stringify({ cpuProfile: { metrics: { count: 3, durationMs: 2 }, rows: [{ name: 'source', count: 3, durationMs: 2 }] } }),
    )
    await writeFile(join(folder, 'missing.json'), JSON.stringify({ cpuProfile: { available: false } }))
    const data = await chart.getData(root)
    expect(data.find((row) => row.filename === 'run-ms').data).toEqual([{ name: 'durationMs (ms)', value: 2 }])
    expect(data.find((row) => row.filename.includes('unavailable')).data).toEqual([])
    expect(chart.createChart().type).toBe('bar-chart')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
