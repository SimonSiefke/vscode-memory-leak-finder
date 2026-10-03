import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@jest/globals'
import * as CreateConcatenatedErrorStringCountChart from '../src/parts/CreateConcatenatedErrorStringCountChart/CreateConcatenatedErrorStringCountChart.ts'
import { getConcatenatedErrorStringCountData } from '../src/parts/GetConcatenatedErrorStringCountData/GetConcatenatedErrorStringCountData.ts'

test('reads the final matching count without exposing diagnostic strings', async () => {
  const workspaceRoot = await mkdtemp(join(tmpdir(), 'concatenated-error-string-count-data-'))
  const basePath = join(workspaceRoot, '.vscode-memory-leak-finder-results')
  const resultsPath = join(basePath, 'concatenated-error-string-count')

  await mkdir(resultsPath, { recursive: true })
  await writeFile(
    join(resultsPath, 'editor-open.json'),
    JSON.stringify({
      concatenatedErrorStringCount: {
        after: 0,
        before: 2386,
        delta: -2386,
        totalAfter: 27759,
        totalBefore: 27792,
        totalDelta: -33,
      },
      isLeak: false,
    }),
  )

  try {
    await expect(getConcatenatedErrorStringCountData(basePath)).resolves.toEqual([
      {
        count: 0,
        index: 0,
        name: 'editor-open.json',
      },
    ])
  } finally {
    await rm(workspaceRoot, { force: true, recursive: true })
  }
})

test('uses the matching count as the chart value', () => {
  expect(CreateConcatenatedErrorStringCountChart.name).toBe('concatenated-error-string-count')
  expect(CreateConcatenatedErrorStringCountChart.createChart()).toEqual({
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Concatenated Error String Count',
  })
})
