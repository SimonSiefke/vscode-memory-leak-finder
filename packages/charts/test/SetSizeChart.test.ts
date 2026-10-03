import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@jest/globals'
import * as Charts from '../src/parts/Charts/Charts.ts'
import * as Chart from '../src/parts/CreateSetSizeChart/CreateSetSizeChart.ts'

test('registers per-scenario set size bars without overwriting map charts', () => {
  expect(Charts.SetSize).toBe(Chart)
  expect(Chart.name).toBe('set-size')
  expect(Chart.multiple).toBe(true)
  expect(Chart.createChart()).toMatchObject({ type: 'bar-chart' })
})

test.each(['setSize', 'set-size'])('reads both snapshots from %s, including zero and decreasing counts', async (directory) => {
  const root = await mkdtemp(join(tmpdir(), 'set-size-chart-'))
  try {
    await expect(Chart.getData(root)).resolves.toEqual([])
    const results = join(root, directory)
    await mkdir(join(results, 'ignored'), { recursive: true })
    await writeFile(join(results, 'ignored.log'), 'not JSON')
    await writeFile(join(results, 'decorations.json'), JSON.stringify({ setSize: { before: 727, after: 732 } }))
    await writeFile(join(results, 'cleanup.json'), JSON.stringify({ setSize: { before: 3, after: 0 } }))
    await expect(Chart.getData(root)).resolves.toEqual([
      {
        filename: 'cleanup',
        data: [
          { name: 'Before iterations', value: 3 },
          { name: 'After iterations', value: 0 },
        ],
      },
      {
        filename: 'decorations',
        data: [
          { name: 'Before iterations', value: 727 },
          { name: 'After iterations', value: 732 },
        ],
      },
    ])
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('rejects incomplete set measurements instead of plotting a zero', async () => {
  const root = await mkdtemp(join(tmpdir(), 'set-size-chart-'))
  try {
    await mkdir(join(root, 'setSize'))
    await writeFile(join(root, 'setSize', 'incomplete.json'), JSON.stringify({ setSize: { after: 10 } }))
    await expect(Chart.getData(root)).rejects.toThrow('Missing finite before/after set sizes in incomplete.json')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
