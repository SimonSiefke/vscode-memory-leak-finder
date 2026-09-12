import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@jest/globals'
import * as Charts from '../src/parts/Charts/Charts.ts'
import * as CreateArrayElementCountChart from '../src/parts/CreateArrayElementCountChart/CreateArrayElementCountChart.ts'
import { getArrayElementCountData } from '../src/parts/GetArrayElementCountData/GetArrayElementCountData.ts'

test('getArrayElementCountData returns total array lengths per frontend test', async () => {
  const workspaceRoot = await mkdtemp(join(tmpdir(), 'array-element-count-data-'))
  const basePath = join(workspaceRoot, '.vscode-memory-leak-finder-results')
  const resultsPath = join(basePath, 'array-element-count')

  await mkdir(resultsPath, { recursive: true })
  await writeFile(
    join(resultsPath, 'editor-open.json'),
    JSON.stringify({
      arrayElementCount: {
        after: 12_345,
        before: 12_000,
      },
    }),
  )

  try {
    const result = await getArrayElementCountData(basePath)

    expect(result).toEqual([
      {
        count: 12_345,
        index: 0,
        name: 'editor-open.json',
      },
    ])
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true })
  }
})

test('createArrayElementCountChart creates one homepage chart for total array length', () => {
  expect(Charts.ArrayElementCount).toBe(CreateArrayElementCountChart)
  expect(CreateArrayElementCountChart.name).toBe('array-element-count')
  expect('multiple' in CreateArrayElementCountChart).toBe(false)
  expect(CreateArrayElementCountChart.createChart()).toEqual({
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Total Array Length',
  })
})
