import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { expect, test } from '@jest/globals'
import { getCpuPerformanceCountersData } from '../src/parts/GetCpuPerformanceCountersData/GetCpuPerformanceCountersData.ts'
import { getInstructionCountData, getInstructionCountResults } from '../src/parts/GetInstructionCountData/GetInstructionCountData.ts'
import { renderInstructionCountHtml } from '../src/parts/GenerateInstructionCountHtml/GenerateInstructionCountHtml.ts'

test('ranks nested scenarios by instructions, excluding unavailable and invalid counts while retaining zero', async () => {
  const root = await mkdtemp(join(tmpdir(), 'instruction-count-'))
  const writeResult = async (name: string, value: number | null, available = true) => {
    const path = join(root, 'cpu-performance-counters', `${name}.json`)
    await mkdir(dirname(path), { recursive: true })
    await writeFile(
      path,
      JSON.stringify({
        cpuPerformanceCounters: {
          metrics: [
            { name: 'instructions', available, value },
            { name: 'cycles', available: true, value: 999 },
          ],
        },
      }),
    )
  }
  try {
    await writeResult('small', 20)
    await writeResult('nested/large', 100)
    await writeResult('unavailable', 200, false)
    await writeResult('missing', null)
    await writeResult('invalid', -1)
    await writeResult('zero', 0)
    await writeFile(join(root, 'cpu-performance-counters', 'notes.txt'), 'not JSON')
    expect(await getInstructionCountData(root)).toEqual([
      {
        filename: 'all-tests',
        data: [
          { name: 'nested/large', value: 100 },
          { name: 'small', value: 20 },
          { name: 'zero', value: 0 },
        ],
      },
    ])
    const results = await getInstructionCountResults(root)
    expect(results.rows.filter((row) => row.value === null).map((row) => row.name)).toEqual(['invalid', 'missing', 'unavailable'])
    const html = renderInstructionCountHtml(results)
    expect(html).toContain('3 tests measured; 3 with unavailable')
    expect(html).toContain('../cpu-performance-counters/nested/large.svg')
    expect(html.indexOf('<td>nested/large</td>')).toBeLessThan(html.indexOf('<td>small</td>'))
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('reports an unsupported runner without fabricating zero instruction counts', async () => {
  const root = await mkdtemp(join(tmpdir(), 'instruction-count-unavailable-'))
  try {
    expect(await getInstructionCountData(root)).toEqual([])
    await writeFile(
      join(root, 'cpu-performance-counters-availability.json'),
      JSON.stringify({ available: false, reason: 'perf: <not supported>' }),
    )
    expect(await getInstructionCountData(root)).toEqual([
      expect.objectContaining({ data: [], filename: 'all-tests', status: expect.any(String) }),
    ])
    const html = renderInstructionCountHtml(await getInstructionCountResults(root))
    expect(html).toContain('Runner counters unavailable: perf: &lt;not supported&gt;')
    expect(html).toContain('0 tests measured')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('keeps unavailable per-test counters visible and escapes names in the report', async () => {
  const root = await mkdtemp(join(tmpdir(), 'instruction-count-empty-'))
  try {
    await mkdir(join(root, 'cpu-performance-counters'))
    await writeFile(join(root, 'cpu-performance-counters', 'empty.json'), JSON.stringify({ cpuPerformanceCounters: { metrics: [] } }))
    expect(await getCpuPerformanceCountersData(root)).toEqual([
      { filename: 'empty', data: [], status: 'CPU performance counters unavailable' },
    ])
    const html = renderInstructionCountHtml({ availability: undefined, rows: [{ name: 'nested/<test & "name">', value: null }] })
    expect(html).toContain('nested/&lt;test &amp; &quot;name&quot;&gt;')
    expect(html).toContain('nested/%3Ctest%20%26%20%22name%22%3E.svg')
    expect(html).toContain('<td>Unavailable</td>')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
