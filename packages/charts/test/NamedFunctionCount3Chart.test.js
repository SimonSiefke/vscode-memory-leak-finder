import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@jest/globals'
import { getNamedFunctionCountData3 } from '../src/parts/GetNamedFunctionCountData3/GetNamedFunctionCountData3.ts'
import { getHighlightLabels } from '../src/parts/GetHighlightLabels/GetHighlightLabels.ts'

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
 *   data: { name: string, comparisonKey?: string }[],
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

test('highlights the removed callback rather than a remaining duplicate label', async () => {
  const notebook = {
    count: 78,
    delta: 74,
    name: 'anonymous',
    originalName: 'e',
    originalLocation: 'src/extension/linkify/vscode-node/notebookCellLinkifier.ts:113:67',
  }
  const configuration = {
    count: 68,
    delta: 37,
    name: 'anonymous',
    originalName: 'e',
    originalLocation: 'src/platform/configuration/common/configurationService.ts:409:67',
  }
  await withNamedFunctionCountResults(
    { 'before.json': [notebook, configuration], 'after.json': [configuration] },
    async (workspaceRoot) => {
      const results = /** @type {NamedFunctionCountResult[]} */ (await getNamedFunctionCountData3('named-function-count3', workspaceRoot))
      const before = results.find((item) => item.filename === 'before')
      const after = results.find((item) => item.filename === 'after')
      if (!before || !after) throw new Error('Expected before and after results')
      expect(before.data.map((item) => item.name)).toEqual(['e', 'e (2)'])
      expect(after.data.map((item) => item.name)).toEqual(['e'])
      expect(getHighlightLabels(before.data, after.data, true)).toEqual(['e'])
    },
  )
})

test('matches source locations across worktree roots and ignores changed generated names', async () => {
  await withNamedFunctionCountResults(
    {
      'before.json': [
        {
          count: 40,
          delta: 37,
          name: 'oldName',
          originalLocation: String.raw`C:\worktrees\before\src\vs\service.ts:10:2`,
          sourceLocation: 'bundle.js:1:1',
        },
      ],
      'after.json': [
        {
          count: 40,
          delta: 37,
          name: 'newName',
          originalLocation: '/worktrees/after/src/vs/service.ts:10:2',
          sourceLocation: 'bundle.js:50:50',
        },
      ],
    },
    async (workspaceRoot) => {
      const results = /** @type {NamedFunctionCountResult[]} */ (await getNamedFunctionCountData3('named-function-count3', workspaceRoot))
      const before = results.find((item) => item.filename === 'before')
      const after = results.find((item) => item.filename === 'after')
      if (!before || !after) throw new Error('Expected before and after results')
      expect(getHighlightLabels(before.data, after.data, true)).toEqual([])
    },
  )
})

test('distinguishes positions in the same file and falls back to generated source locations', async () => {
  const first = { count: 40, delta: 37, name: 'anonymous', sourceLocation: 'file:///before/extensions/one/out/extension.js:10:2' }
  const second = { count: 40, delta: 37, name: 'anonymous', sourceLocation: 'file:///before/extensions/one/out/extension.js:20:2' }
  const otherExtension = { count: 40, delta: 37, name: 'anonymous', sourceLocation: 'file:///after/extensions/two/out/extension.js:10:2' }
  await withNamedFunctionCountResults(
    {
      'before.json': [first, second],
      'after.json': [{ ...second, sourceLocation: 'file:///after/extensions/one/out/extension.js:20:2' }, otherExtension],
    },
    async (workspaceRoot) => {
      const results = /** @type {NamedFunctionCountResult[]} */ (await getNamedFunctionCountData3('named-function-count3', workspaceRoot))
      const before = results.find((item) => item.filename === 'before')
      const after = results.find((item) => item.filename === 'after')
      if (!before || !after) throw new Error('Expected before and after results')
      expect(getHighlightLabels(before.data, after.data, true)).toEqual(['anonymous (extension.js)'])
    },
  )
})

test('preserves name matching for other charts and can disable highlighting', () => {
  const before = [{ name: 'removed' }, { name: 'remaining' }]
  const after = [{ name: 'remaining' }]
  expect(getHighlightLabels(before, after, true)).toEqual(['removed'])
  expect(getHighlightLabels(before, after, false)).toEqual([])
  expect(getHighlightLabels([{ filename: 'cpu-profile', data: [] }], [], true)).toEqual([])
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
