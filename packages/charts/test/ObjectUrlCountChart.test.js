import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@jest/globals'
import * as Charts from '../src/parts/Charts/Charts.ts'
import * as CreateObjectUrlCountChart from '../src/parts/CreateObjectUrlCountChart/CreateObjectUrlCountChart.ts'
import { getObjectUrlCountData } from '../src/parts/GetObjectUrlCountData/GetObjectUrlCountData.ts'

test('getObjectUrlCountData returns active object URL counts per frontend test', async () => {
  const workspaceRoot = await mkdtemp(join(tmpdir(), 'object-url-count-data-'))
  const basePath = join(workspaceRoot, '.vscode-memory-leak-finder-results')
  const resultsPath = join(basePath, 'object-url-count')

  await mkdir(resultsPath, { recursive: true })
  await writeFile(
    join(resultsPath, 'editor-open.json'),
    JSON.stringify({
      objectUrlCount: {
        created: 5,
        revoked: 2,
        unreleased: 3,
      },
    }),
  )

  try {
    const result = await getObjectUrlCountData(basePath)

    expect(result).toEqual([
      {
        data: [
          {
            count: 5,
            delta: 3,
            name: 'Object URLs',
          },
        ],
        filename: 'editor-open',
      },
    ])
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true })
  }
})

test('createObjectUrlCountChart creates one black/red chart per result', () => {
  expect(Charts.ObjectUrlCount).toBe(CreateObjectUrlCountChart)
  expect(CreateObjectUrlCountChart.name).toBe('object-url-count')
  expect(CreateObjectUrlCountChart.multiple).toBe(true)
  expect(CreateObjectUrlCountChart.createChart()).toEqual({
    fontSize: 12,
    marginLeft: 180,
    marginRight: 180,
    type: 'dual-bar-chart',
    width: 900,
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Object URLs',
  })
})
