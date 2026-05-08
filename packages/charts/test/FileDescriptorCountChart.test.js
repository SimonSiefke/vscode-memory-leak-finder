import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@jest/globals'
import * as CreateFileDescriptorCountChart from '../src/parts/CreateFileDescriptorCountChart/CreateFileDescriptorCountChart.ts'
import { getFolderContentHtml } from '../src/parts/GenerateIndexHtml/GenerateIndexHtml.ts'
import { getFileDescriptorCountData } from '../src/parts/GetFileDescriptorCountData/GetFileDescriptorCountData.ts'

test('getFileDescriptorCountData returns sorted multi-chart data per test file', async () => {
  const workspaceRoot = await mkdtemp(join(tmpdir(), 'file-descriptor-count-data-'))
  const basePath = join(workspaceRoot, '.vscode-memory-leak-finder-results')
  const resultsPath = join(basePath, 'file-descriptor-count')

  await mkdir(resultsPath, { recursive: true })
  await writeFile(
    join(resultsPath, 'b.json'),
    JSON.stringify({
      fileDescriptorCount: [
        { count: 12, delta: 2, name: 'Renderer' },
        { count: 50, delta: 10, name: 'VS Code' },
      ],
      isLeak: true,
    }),
  )
  await writeFile(
    join(resultsPath, 'a.json'),
    JSON.stringify({
      fileDescriptorCount: [
        { count: 5, delta: 0, name: 'Extension Host' },
        { count: 9, delta: 3, name: 'Worker' },
      ],
      isLeak: true,
    }),
  )

  try {
    const result = await getFileDescriptorCountData(basePath)

    expect(result).toEqual([
      {
        data: [
          { count: 9, delta: 3, name: 'Worker' },
          { count: 5, delta: 0, name: 'Extension Host' },
        ],
        filename: 'a',
      },
      {
        data: [
          { count: 50, delta: 10, name: 'VS Code' },
          { count: 12, delta: 2, name: 'Renderer' },
        ],
        filename: 'b',
      },
    ])
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true })
  }
})

test('createFileDescriptorCountChart uses dual bar multi-chart configuration', () => {
  expect(CreateFileDescriptorCountChart.name).toBe('file-descriptor-count')
  expect(CreateFileDescriptorCountChart.multiple).toBe(true)
  expect(CreateFileDescriptorCountChart.createChart()).toEqual(
    expect.objectContaining({
      type: 'dual-bar-chart',
      yLabel: 'File Descriptor Counts',
    }),
  )
})

test('getFolderContentHtml uses sidebar layout for file-descriptor-count charts', () => {
  const html = getFolderContentHtml('file-descriptor-count', ['base.svg', 'activity-bar-toggle.svg', 'styles.css'])

  expect(html).toContain('class="Layout"')
  expect(html).toContain('class="Navigation"')
  expect(html).toContain('href="#chart-base"')
  expect(html).toContain('id="chart-activity-bar-toggle"')
  expect(html).toContain('class="Charts SingleColumn"')
})
