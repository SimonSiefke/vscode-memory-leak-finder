import { expect, test } from '@jest/globals'
import type {
  CodeSizeBreakdown,
  CompiledCodeSnapshotAnalysis,
} from '../src/parts/AnalyzeCompiledCodeSnapshot/AnalyzeCompiledCodeSnapshot.ts'
import { compareCompiledCodeSizeInternal } from '../src/parts/CompareCompiledCodeSize/CompareCompiledCodeSize.ts'

const breakdown = (totalBytes: number): CodeSizeBreakdown => ({
  bytecodeBytes: totalBytes,
  instructionBytes: 0,
  metadataBytes: 0,
  totalBytes,
})

const createAnalysis = (sizes: readonly number[]): CompiledCodeSnapshotAnalysis => {
  const totalBytes = sizes.reduce((total, size) => total + size, 0)
  return {
    functions: sizes.map((size, index) => ({
      ...breakdown(size),
      column: index,
      key: `1:${index}:0:function${index}`,
      line: index,
      name: `function${index}`,
      scriptId: 1,
    })),
    totals: {
      ...breakdown(totalBytes),
      attributedBytes: totalBytes,
      sharedBytes: 10,
      unattributedBytes: 20,
    },
  }
}

test('compares function sizes, enriches locations, and limits both rankings', async () => {
  const before = createAnalysis(Array.from({ length: 110 }, (_, index) => index))
  const after = createAnalysis(Array.from({ length: 110 }, (_, index) => index + 5))

  const result = await compareCompiledCodeSizeInternal(before, after, {
    1: {
      url: 'file:///app.js',
    },
  })

  expect(result.isLeak).toBe(false)
  expect(result.largestFunctions).toHaveLength(100)
  expect(result.largestGrowth).toHaveLength(100)
  expect(result.largestFunctions[0]).toMatchObject({
    after: breakdown(114),
    before: breakdown(109),
    delta: breakdown(5),
    name: 'function109',
    sourceLocation: 'file:///app.js:109:109',
  })
  expect(result.largestGrowth[0].delta.totalBytes).toBe(5)
  expect(result.totals.delta).toEqual({
    attributedBytes: 550,
    bytecodeBytes: 550,
    instructionBytes: 0,
    metadataBytes: 0,
    sharedBytes: 0,
    totalBytes: 550,
    unattributedBytes: 0,
  })
})
