import { expect, test } from '@jest/globals'
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { MockRpc } from '@lvce-editor/rpc'
import * as AddOriginalSourcesToData from '../src/parts/AddOriginalSourcesToData/AddOriginalSourcesToData.ts'
import * as LaunchSourceMapWorker from '../src/parts/LaunchSourceMapWorker/LaunchSourceMapWorker.ts'

test.skip('addOriginalSourcesToData - enriches data with original sources', async () => {
  const tempRoot = join(tmpdir(), `test-add-original-sources-${Date.now()}`)
  const extensionSourceMapsDir = join(tempRoot, '.extension-source-maps', 'github.copilot-chat-v1.0.0', 'dist')
  await mkdir(extensionSourceMapsDir, { recursive: true })

  const sourceMapContent = JSON.stringify({
    version: 3,
    sources: ['src/index.ts'],
    mappings: 'AAAA',
    names: [],
  })
  await writeFile(join(extensionSourceMapsDir, 'extension.js.map'), sourceMapContent)

  const dataFile = join(tempRoot, 'input.json')
  const outputFile = join(tempRoot, 'result.json')
  const data = {
    namedFunctionCount2: [
      {
        name: 'testFunction',
        count: 10,
        delta: 5,
        line: 1,
        column: 10,
        url: `file://${tempRoot}/.vscode-extensions/github.copilot-chat-v1.0.0/dist/extension.js`,
      },
    ],
  }
  await writeFile(dataFile, JSON.stringify(data), 'utf8')

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, ...params: readonly any[]) => {
      if (method === 'SourceMap.getCleanPositionsMap') {
        const sourceMapUrlMap = params[0] as Record<string, number[]>
        const result: Record<string, any[]> = {}
        for (const [url, positions] of Object.entries(sourceMapUrlMap)) {
          result[url] = positions
            .map((_, index) => {
              if (index % 2 === 0) {
                return {
                  source: 'src/index.ts',
                  line: 1,
                  column: 5,
                  name: 'testFunction',
                }
              }
              return null
            })
            .filter(Boolean)
        }
        return Promise.resolve(result)
      }
      throw new Error(`unexpected method ${method}`)
    },
  })

  // Mock the launchSourceMapWorker function
  const originalLaunch = LaunchSourceMapWorker.launchSourceMapWorker
  ;(LaunchSourceMapWorker as any).launchSourceMapWorker = async () => {
    return mockRpc
  }

  try {
    await AddOriginalSourcesToData.addOriginalSourcesToData(dataFile, 'v1.0.0', outputFile)

    const resultContent = await readFile(outputFile, 'utf8')
    const result = JSON.parse(resultContent)

    expect(result.namedFunctionCount2).toHaveLength(1)
    expect(result.namedFunctionCount2[0]).toMatchObject({
      name: 'testFunction',
      count: 10,
      delta: 5,
      originalSource: 'src/index.ts',
      originalUrl: 'src/index.ts',
      originalLine: 1,
      originalColumn: 5,
      originalName: 'testFunction',
      originalLocation: 'src/index.ts:1:5',
    })
  } finally {
    ;(LaunchSourceMapWorker as any).launchSourceMapWorker = originalLaunch
    await rm(tempRoot, { recursive: true, force: true })
  }
})

test.skip('addOriginalSourcesToData - handles array data', async () => {
  const tempRoot = join(tmpdir(), `test-add-original-sources-array-${Date.now()}`)
  const extensionSourceMapsDir = join(tempRoot, '.extension-source-maps', 'github.copilot-chat-v1.0.0', 'dist')
  await mkdir(extensionSourceMapsDir, { recursive: true })

  const dataFile = join(tempRoot, 'input.json')
  const outputFile = join(tempRoot, 'result.json')
  const data = [
    {
      name: 'testFunction',
      count: 10,
      delta: 5,
      line: 1,
      column: 10,
      url: `file://${tempRoot}/.vscode-extensions/github.copilot-chat-v1.0.0/dist/extension.js`,
    },
  ]
  await writeFile(dataFile, JSON.stringify(data), 'utf8')

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: () => {
      return Promise.resolve({})
    },
  })

  const originalLaunch = LaunchSourceMapWorker.launchSourceMapWorker
  ;(LaunchSourceMapWorker as any).launchSourceMapWorker = async () => {
    return mockRpc
  }

  try {
    await AddOriginalSourcesToData.addOriginalSourcesToData(dataFile, 'v1.0.0', outputFile)

    const resultContent = await readFile(outputFile, 'utf8')
    const result = JSON.parse(resultContent)

    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(1)
  } finally {
    ;(LaunchSourceMapWorker as any).launchSourceMapWorker = originalLaunch
    await rm(tempRoot, { recursive: true, force: true })
  }
})

test.skip('addOriginalSourcesToData - handles data without URLs', async () => {
  const tempRoot = join(tmpdir(), `test-add-original-sources-no-urls-${Date.now()}`)
  const dataFile = join(tempRoot, 'input.json')
  const outputFile = join(tempRoot, 'result.json')
  const data = {
    namedFunctionCount2: [
      {
        name: 'testFunction',
        count: 10,
        delta: 5,
      },
    ],
  }
  await writeFile(dataFile, JSON.stringify(data), 'utf8')

  await AddOriginalSourcesToData.addOriginalSourcesToData(dataFile, 'v1.0.0', outputFile)

  const resultContent = await readFile(outputFile, 'utf8')
  const result = JSON.parse(resultContent)

  expect(result.namedFunctionCount2).toHaveLength(1)
  expect(result.namedFunctionCount2[0]).toMatchObject({
    name: 'testFunction',
    count: 10,
    delta: 5,
  })

  await rm(tempRoot, { recursive: true, force: true })
})
