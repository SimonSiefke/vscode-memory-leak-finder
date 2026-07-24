import { expect, test } from '@jest/globals'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { SourceMapGenerator } from 'source-map'
import { summarizeProfiles } from '../src/CpuProfile.ts'

test('summarizeProfiles ranks JavaScript self and total time', async () => {
  const summary = await summarizeProfiles([
    {
      nodes: [
        {
          callFrame: { columnNumber: 0, functionName: '(root)', lineNumber: 0, url: '' },
          children: [2],
          id: 1,
        },
        {
          callFrame: { columnNumber: 2, functionName: 'busyLoop', lineNumber: 4, url: 'file:///workbench.js' },
          id: 2,
        },
      ],
      samples: [2, 2],
      timeDeltas: [1000, 2000],
    },
  ])

  expect(summary.totalTimeMs).toBe(3)
  expect(summary.hotspots[0]).toMatchObject({
    functionName: 'busyLoop',
    selfTimeMs: 3,
    totalTimeMs: 3,
  })
  expect(summary.amdahlMaximumImprovement).toBe(1)
})

test('summarizeProfiles recommends native diagnostics for program-heavy profiles', async () => {
  const summary = await summarizeProfiles([
    {
      nodes: [
        {
          callFrame: { columnNumber: -1, functionName: '(program)', lineNumber: -1, url: '' },
          id: 1,
        },
      ],
      samples: [1],
      timeDeltas: [1000],
    },
  ])
  expect(summary.nextDiagnostics).toContain('native-perf-record')
})

test('summarizeProfiles resolves a synthetic hotspot to original source', async () => {
  const sourceRoot = await mkdtemp(join(tmpdir(), 'performance-lab-source-map-'))
  const mapDirectory = join(sourceRoot, 'out-vscode-min', 'vs', 'workbench')
  await mkdir(mapDirectory, { recursive: true })
  const sourceMap = new SourceMapGenerator({
    file: 'workbench.desktop.main.js',
  })
  sourceMap.addMapping({
    generated: {
      column: 2,
      line: 5,
    },
    name: 'busyLoop',
    original: {
      column: 4,
      line: 10,
    },
    source: 'src/vs/editor/busyLoop.ts',
  })
  await writeFile(join(mapDirectory, 'workbench.desktop.main.js.map'), sourceMap.toString())

  const summary = await summarizeProfiles(
    [
      {
        nodes: [
          {
            callFrame: {
              columnNumber: 2,
              functionName: 'minifiedBusyLoop',
              lineNumber: 4,
              url: 'vscode-file://vscode-app/build/resources/app/out/vs/workbench/workbench.desktop.main.js',
            },
            id: 1,
          },
        ],
        samples: [1],
        timeDeltas: [1000],
      },
    ],
    sourceRoot,
  )

  expect(summary.hotspots[0]).toMatchObject({
    column: 5,
    functionName: 'busyLoop',
    line: 10,
    source: 'src/vs/editor/busyLoop.ts',
  })
})
