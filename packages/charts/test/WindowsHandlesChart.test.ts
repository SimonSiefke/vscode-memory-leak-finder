import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@jest/globals'
import * as WindowsHandlesChart from '../src/parts/CreateWindowsHandlesChart/CreateWindowsHandlesChart.ts'
import { getWindowsHandlesData } from '../src/parts/GetWindowsHandlesData/GetWindowsHandlesData.ts'

test('getWindowsHandlesData reads positive per-process handle growth sorted by total handles', async () => {
  const root = await mkdtemp(join(tmpdir(), 'windows-handles-chart-'))
  try {
    const results = join(root, 'windows-handles')
    await mkdir(results)
    await writeFile(
      join(results, 'editor-open.json'),
      JSON.stringify({
        windowsHandles: {
          topGrowth: [
            { afterHandles: 120, beforeHandles: 100, deltaHandles: 20, name: 'node.exe', pid: 20 },
            { afterHandles: 300, beforeHandles: 250, deltaHandles: 50, name: 'Code.exe', pid: 10 },
            { afterHandles: 400, beforeHandles: 400, deltaHandles: 0, name: 'stable.exe', pid: 30 },
          ],
        },
      }),
    )

    await expect(getWindowsHandlesData(root)).resolves.toEqual([
      {
        data: [
          { count: 300, delta: 50, name: 'Code.exe (PID 10)' },
          { count: 120, delta: 20, name: 'node.exe (PID 20)' },
        ],
        filename: 'editor-open',
      },
    ])
  } finally {
    await rm(root, { force: true, recursive: true })
  }
})

test('getWindowsHandlesData returns no bars when no process gained handles', async () => {
  const root = await mkdtemp(join(tmpdir(), 'windows-handles-chart-empty-'))
  try {
    const results = join(root, 'windows-handles')
    await mkdir(results)
    await writeFile(join(results, 'editor-open.json'), JSON.stringify({ windowsHandles: { topGrowth: [] } }))

    await expect(getWindowsHandlesData(root)).resolves.toEqual([{ data: [], filename: 'editor-open' }])
  } finally {
    await rm(root, { force: true, recursive: true })
  }
})

test('windows handles uses a dual comparison bar chart', () => {
  expect(WindowsHandlesChart.createChart()).toMatchObject({
    type: 'dual-bar-chart',
    yLabel: 'Windows Handles',
  })
})
