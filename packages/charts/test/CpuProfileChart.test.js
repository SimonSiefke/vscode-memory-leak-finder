import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@jest/globals'
import * as CreateCpuProfileChart from '../src/parts/CreateCpuProfileChart/CreateCpuProfileChart.ts'
import { getCpuProfileData } from '../src/parts/GetCpuProfileData/GetCpuProfileData.ts'

test('getCpuProfileData returns merged flame chart frames per test file', async () => {
  const workspaceRoot = await mkdtemp(join(tmpdir(), 'cpu-profile-data-'))
  const basePath = join(workspaceRoot, '.vscode-memory-leak-finder-results')
  const resultsPath = join(basePath, 'cpu-profile')

  await mkdir(resultsPath, { recursive: true })
  await writeFile(
    join(resultsPath, 'editor-open.json'),
    JSON.stringify({
      cpuProfile: {
        raw: {
          after: {
            nodes: [
              {
                callFrame: {
                  columnNumber: -1,
                  functionName: '(root)',
                  lineNumber: -1,
                  url: '',
                },
                children: [2],
                id: 1,
              },
              {
                callFrame: {
                  columnNumber: 4,
                  functionName: 'renderWorkbench',
                  lineNumber: 10,
                  url: 'file:///workbench.js',
                },
                children: [3],
                id: 2,
              },
              {
                callFrame: {
                  columnNumber: 2,
                  functionName: 'layout',
                  lineNumber: 20,
                  url: 'file:///layout.js',
                },
                id: 3,
              },
            ],
            samples: [2, 2, 3, 3],
            timeDeltas: [1000, 1000, 2000, 1000],
          },
        },
      },
    }),
  )

  try {
    const result = await getCpuProfileData(basePath)

    expect(result).toEqual([
      {
        data: [
          {
            colorKey: 'file:///layout.js:20:2',
            depth: 1,
            durationMs: 3,
            hitCount: 2,
            location: 'file:///layout.js:20:2',
            name: 'layout',
            selfTimeMs: 3,
            startMs: 2,
            totalTimeMs: 3,
          },
          {
            colorKey: 'file:///workbench.js:10:4',
            depth: 0,
            durationMs: 5,
            hitCount: 2,
            location: 'file:///workbench.js:10:4',
            name: 'renderWorkbench',
            selfTimeMs: 2,
            startMs: 0,
            totalTimeMs: 5,
          },
        ],
        filename: 'editor-open',
      },
    ])
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true })
  }
})

test('createCpuProfileChart uses flame chart multi-chart configuration', () => {
  expect(CreateCpuProfileChart.name).toBe('cpu-profile')
  expect(CreateCpuProfileChart.multiple).toBe(true)
  expect(CreateCpuProfileChart.createChart()).toEqual(
    expect.objectContaining({
      type: 'cpu-profile-flame-chart',
      width: 1400,
    }),
  )
})
