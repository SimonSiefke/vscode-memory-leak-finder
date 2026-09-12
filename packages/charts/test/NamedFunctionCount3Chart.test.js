import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@jest/globals'
import { getNamedFunctionCountData3 } from '../src/parts/GetNamedFunctionCountData3/GetNamedFunctionCountData3.ts'

/**
 * @typedef {{
 *   count: number,
 *   delta: number,
 *   name: string,
 *   originalLocation?: string,
 *   originalName?: string,
 *   sourceLocation?: string,
 * }} RawNamedFunctionCount
 */

/**
 * @typedef {{
 *   data: { name: string }[],
 *   filename: string,
 * }} NamedFunctionCountResult
 */

/**
 * @param {Record<string, RawNamedFunctionCount[]>} files
 * @param {(workspaceRoot: string) => Promise<void>} fn
 */
const withNamedFunctionCountResults = async (files, fn) => {
  const workspaceRoot = await mkdtemp(join(tmpdir(), 'named-function-count-3-data-'))
  const resultsPath = join(workspaceRoot, 'named-function-count3')
  await mkdir(resultsPath, { recursive: true })
  for (const [fileName, namedFunctionCount3] of Object.entries(files)) {
    await writeFile(join(resultsPath, fileName), JSON.stringify({ namedFunctionCount3 }))
  }
  try {
    await fn(workspaceRoot)
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true })
  }
}

test('anonymous labels stay stable when callbacks from different files are reordered', async () => {
  const chatInput = {
    count: 39,
    delta: 37,
    name: 'anonymous',
    originalLocation: 'src/vs/workbench/contrib/chat/browser/widget/input/chatInputPart.ts:3961:45',
  }
  const terminalDataBuffering = {
    count: 39,
    delta: 37,
    name: 'anonymous',
    originalLocation: 'src/vs/platform/terminal/common/terminalDataBuffering.ts:30:28',
  }

  await withNamedFunctionCountResults(
    {
      'after.json': [terminalDataBuffering, chatInput],
      'before.json': [chatInput, terminalDataBuffering],
    },
    async (workspaceRoot) => {
      const result = /** @type {NamedFunctionCountResult[]} */ (await getNamedFunctionCountData3('named-function-count3', workspaceRoot))
      const before = result.find((item) => item.filename === 'before')
      const after = result.find((item) => item.filename === 'after')
      const expectedNames = ['anonymous (chatInputPart.ts)', 'anonymous (terminalDataBuffering.ts)']
      if (!before || !after) {
        throw new Error('Expected before and after results')
      }

      expect(before.data.map((item) => item.name).sort()).toEqual(expectedNames)
      expect(after.data.map((item) => item.name).sort()).toEqual(expectedNames)
    },
  )
})

test('anonymous labels number duplicates per filename and preserve existing fallbacks', async () => {
  await withNamedFunctionCountResults(
    {
      'result.json': [
        {
          count: 10,
          delta: 2,
          name: 'anonymous',
          originalLocation: String.raw`C:\src\chatInputPart.ts:10:2`,
        },
        {
          count: 9,
          delta: 2,
          name: 'anonymous',
          originalLocation: 'src/chatInputPart.ts:20:4',
        },
        {
          count: 8,
          delta: 2,
          name: 'anonymous',
          sourceLocation: 'vscode-file://vscode-app/out/terminalDataBuffering.js:30:28',
        },
        { count: 7, delta: 2, name: 'anonymous' },
        { count: 6, delta: 2, name: 'anonymous' },
        {
          count: 5,
          delta: 2,
          name: 'anonymous',
          originalLocation: 'src/terminalService.ts:100:20',
          originalName: 'instance',
        },
      ],
    },
    async (workspaceRoot) => {
      const result = /** @type {NamedFunctionCountResult[]} */ (await getNamedFunctionCountData3('named-function-count3', workspaceRoot))

      expect(result[0].data.map((item) => item.name)).toEqual([
        'anonymous (chatInputPart.ts)',
        'anonymous (chatInputPart.ts) (2)',
        'anonymous (terminalDataBuffering.js)',
        'anonymous',
        'anonymous (2)',
        'instance',
      ])
    },
  )
})
