import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@jest/globals'
import * as CreateCompiledCodeSizeByFileChart from '../src/parts/CreateCompiledCodeSizeByFileChart/CreateCompiledCodeSizeByFileChart.ts'
import * as CreateCompiledCodeSizeByFunctionChart from '../src/parts/CreateCompiledCodeSizeByFunctionChart/CreateCompiledCodeSizeByFunctionChart.ts'
import {
  getCompiledCodeSizeByFileData,
  getCompiledCodeSizeByFunctionData,
} from '../src/parts/GetCompiledCodeSizeData/GetCompiledCodeSizeData.ts'

const breakdown = (totalBytes: number) => ({
  bytecodeBytes: totalBytes / 4,
  instructionBytes: totalBytes / 2,
  metadataBytes: totalBytes / 4,
  totalBytes,
})

test('gets compiled code size charts by function and exact source-file aggregate', async () => {
  const workspaceRoot = await mkdtemp(join(tmpdir(), 'compiled-code-size-chart-'))
  const resultsPath = join(workspaceRoot, 'compiled-code-size')
  await mkdir(resultsPath, { recursive: true })
  await writeFile(
    join(resultsPath, 'editor-open.json'),
    JSON.stringify({
      compiledCodeSize: {
        functionCount: 12,
        largestFiles: [
          {
            after: breakdown(8192),
            before: breakdown(4096),
            delta: breakdown(4096),
            source: 'src/vs/workbench.ts',
          },
          {
            after: breakdown(2048),
            before: breakdown(1024),
            delta: breakdown(1024),
            source: 'src/vs/editor.ts',
          },
        ],
        largestFunctions: [
          {
            after: breakdown(4096),
            before: breakdown(2048),
            delta: breakdown(2048),
            name: 'a',
            originalLocation: 'src/vs/workbench.ts:10:2',
            originalName: 'Workbench.render',
          },
          {
            after: breakdown(2048),
            before: breakdown(1024),
            delta: breakdown(1024),
            name: '',
            sourceLocation: 'vscode-file://vscode-app/resources/app/out/workbench.js:20:4',
          },
        ],
        sourceFileCount: 8,
      },
    }),
  )

  try {
    expect(await getCompiledCodeSizeByFunctionData(workspaceRoot)).toEqual([
      {
        data: [
          {
            after: breakdown(4096),
            before: breakdown(2048),
            delta: breakdown(2048),
            name: 'Workbench.render (src/vs/workbench.ts:10:2)',
          },
          {
            after: breakdown(2048),
            before: breakdown(1024),
            delta: breakdown(1024),
            name: '(anonymous) (out/workbench.js:20:4)',
          },
        ],
        filename: 'editor-open',
        omittedEntryCount: 10,
      },
    ])
    expect(await getCompiledCodeSizeByFileData(workspaceRoot)).toEqual([
      {
        data: [
          {
            after: breakdown(8192),
            before: breakdown(4096),
            delta: breakdown(4096),
            name: 'src/vs/workbench.ts',
          },
          {
            after: breakdown(2048),
            before: breakdown(1024),
            delta: breakdown(1024),
            name: 'src/vs/editor.ts',
          },
        ],
        filename: 'editor-open',
        omittedEntryCount: 6,
      },
    ])
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true })
  }
})

test('file chart falls back to aggregating function rows from older results', async () => {
  const workspaceRoot = await mkdtemp(join(tmpdir(), 'compiled-code-size-old-chart-'))
  const resultsPath = join(workspaceRoot, 'compiled-code-size')
  await mkdir(resultsPath, { recursive: true })
  await writeFile(
    join(resultsPath, 'base.json'),
    JSON.stringify({
      compiledCodeSize: {
        largestFunctions: [
          {
            after: breakdown(4096),
            before: breakdown(2048),
            delta: breakdown(2048),
            originalLocation: 'src/a.ts:10:2',
          },
          {
            after: breakdown(2048),
            before: breakdown(1024),
            delta: breakdown(1024),
            originalLocation: 'src/a.ts:20:4',
          },
        ],
      },
    }),
  )

  try {
    expect(await getCompiledCodeSizeByFileData(workspaceRoot)).toEqual([
      {
        data: [
          {
            after: breakdown(6144),
            before: breakdown(3072),
            delta: breakdown(3072),
            name: 'src/a.ts',
          },
        ],
        filename: 'base',
        omittedEntryCount: 0,
      },
    ])
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true })
  }
})

test('compiled code size chart visitors use the compiled-code renderer', () => {
  expect(CreateCompiledCodeSizeByFunctionChart.name).toBe('compiled-code-size-by-function')
  expect(CreateCompiledCodeSizeByFunctionChart.multiple).toBe(true)
  expect(CreateCompiledCodeSizeByFunctionChart.createChart()).toEqual(
    expect.objectContaining({
      title: 'Largest compiled-code functions',
      type: 'compiled-code-size-chart',
    }),
  )

  expect(CreateCompiledCodeSizeByFileChart.name).toBe('compiled-code-size-by-file')
  expect(CreateCompiledCodeSizeByFileChart.multiple).toBe(true)
  expect(CreateCompiledCodeSizeByFileChart.createChart()).toEqual(
    expect.objectContaining({
      title: 'Compiled code by source file',
      type: 'compiled-code-size-chart',
    }),
  )
})
