import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@jest/globals'
import * as PoolmonChart from '../src/parts/CreatePoolmonChart/CreatePoolmonChart.ts'
import { getPoolmonData } from '../src/parts/GetPoolmonData/GetPoolmonData.ts'

test('getPoolmonData reads leaking process memory as sorted comparison bars', async () => {
  const root = await mkdtemp(join(tmpdir(), 'poolmon-chart-'))
  try {
    const results = join(root, 'poolmon')
    await mkdir(results)
    await writeFile(
      join(results, 'editor-open.json'),
      JSON.stringify({
        poolmon: {
          processMemoryGrowth: [
            { afterMemoryKb: 100, beforeMemoryKb: 80, deltaMemoryKb: 20, imageName: 'Code.exe', pid: 1 },
            { afterMemoryKb: 300, beforeMemoryKb: 200, deltaMemoryKb: 100, imageName: 'Code.exe', pid: 2 },
            { afterMemoryKb: 250, beforeMemoryKb: 250, deltaMemoryKb: 0, imageName: 'stable.exe', pid: 3 },
            { afterMemoryKb: 150, beforeMemoryKb: 140, deltaMemoryKb: 10, imageName: 'worker.exe', pid: 4 },
            { afterMemoryKb: 1200, beforeMemoryKb: 100, deltaMemoryKb: 1100, imageName: 'FIREFOX.EXE', pid: 5 },
            { afterMemoryKb: 1100, beforeMemoryKb: 100, deltaMemoryKb: 1000, imageName: 'ChatGPT.exe', pid: 6 },
            { afterMemoryKb: 1000, beforeMemoryKb: 100, deltaMemoryKb: 900, imageName: 'OneDrive.exe', pid: 7 },
            { afterMemoryKb: 900, beforeMemoryKb: 100, deltaMemoryKb: 800, imageName: 'msedgewebview2.exe', pid: 8 },
            { afterMemoryKb: 800, beforeMemoryKb: 100, deltaMemoryKb: 700, imageName: 'svchost.exe', pid: 9 },
          ],
        },
      }),
    )
    await writeFile(join(results, 'ignored.log'), 'not JSON')

    await expect(getPoolmonData(root)).resolves.toEqual([
      {
        data: [
          { count: 300, delta: 100, name: 'Code.exe (PID 2)' },
          { count: 150, delta: 10, name: 'worker.exe' },
          { count: 100, delta: 20, name: 'Code.exe (PID 1)' },
        ],
        filename: 'editor-open',
      },
    ])
  } finally {
    await rm(root, { force: true, recursive: true })
  }
})

test('getPoolmonData returns no bars when there are no leaking processes', async () => {
  const root = await mkdtemp(join(tmpdir(), 'poolmon-chart-no-growth-'))
  try {
    const results = join(root, 'poolmon')
    await mkdir(results)
    await writeFile(
      join(results, 'editor-open.json'),
      JSON.stringify({
        poolmon: { processMemoryGrowth: [{ afterMemoryKb: 20, beforeMemoryKb: 20, deltaMemoryKb: 0, imageName: 'Code.exe' }] },
      }),
    )

    await expect(getPoolmonData(root)).resolves.toEqual([{ data: [], filename: 'editor-open' }])
  } finally {
    await rm(root, { force: true, recursive: true })
  }
})

test('getPoolmonData excludes unrelated Windows and tooling processes', async () => {
  const root = await mkdtemp(join(tmpdir(), 'poolmon-chart-ignored-processes-'))
  try {
    const results = join(root, 'poolmon')
    await mkdir(results)
    const ignoredNames = [
      'ApplicationFrameHost.exe',
      'backgroundTaskHost.exe',
      'codex-code-mode-host.exe',
      'csrss.exe',
      'dwm.exe',
      'explorer.exe',
      'Runner.Listener.exe',
      'Runner.Worker.exe',
      'RuntimeBroker.exe',
      'SearchIndexer.exe',
      'Taskmgr.exe',
      'TiWorker.exe',
      'TrustedInstaller.exe',
      'WaAppAgent.exe',
      'WindowsAzureGuestAgent.exe',
      'WmiPrvSE.exe',
    ]
    await writeFile(
      join(results, 'editor-open.json'),
      JSON.stringify({
        poolmon: {
          processMemoryGrowth: ignoredNames.map((imageName, index) => ({
            afterMemoryKb: 10_000 - index,
            beforeMemoryKb: 0,
            deltaMemoryKb: 10_000 - index,
            imageName,
            pid: index + 1,
          })),
        },
      }),
    )

    await expect(getPoolmonData(root)).resolves.toEqual([{ data: [], filename: 'editor-open' }])
  } finally {
    await rm(root, { force: true, recursive: true })
  }
})

test('getPoolmonData ignores incomplete process rows', async () => {
  const root = await mkdtemp(join(tmpdir(), 'poolmon-chart-incomplete-'))
  try {
    const results = join(root, 'poolmon')
    await mkdir(results)
    await writeFile(join(results, 'incomplete.json'), JSON.stringify({ poolmon: { processMemoryGrowth: [{ afterMemoryKb: 2048 }] } }))

    await expect(getPoolmonData(root)).resolves.toEqual([{ data: [], filename: 'incomplete' }])
  } finally {
    await rm(root, { force: true, recursive: true })
  }
})

test('poolmon uses a dual comparison bar chart for process memory', () => {
  expect(PoolmonChart.createChart()).toMatchObject({
    type: 'dual-bar-chart',
    yLabel: 'Process Memory (KiB)',
  })
})
