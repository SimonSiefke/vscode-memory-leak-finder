import { expect, test } from '@jest/globals'
import * as CompareHeapUsage from '../src/parts/CompareHeapUsage/CompareHeapUsage.ts'

const MB = 1000 * 1000

test('compareHeapUsage keeps legacy fields and adds byte deltas', async () => {
  const result = await CompareHeapUsage.compareHeapUsage(
    { backingStorageSize: 90 * MB, embedderHeapUsedSize: 22 * MB, totalSize: 40 * MB, usedSize: 30 * MB },
    { backingStorageSize: 100 * MB, embedderHeapUsedSize: 21 * MB, totalSize: 50 * MB, usedSize: 35 * MB },
  )
  expect(result).toEqual({
    bytes: {
      backingStorageSize: { after: 100 * MB, before: 90 * MB, delta: 10 * MB },
      embedderHeapUsedSize: { after: 21 * MB, before: 22 * MB, delta: -1 * MB },
      totalSize: { after: 50 * MB, before: 40 * MB, delta: 10 * MB },
      unusedCommittedBytes: { after: 15 * MB, before: 10 * MB, delta: 5 * MB },
      usedSize: { after: 35 * MB, before: 30 * MB, delta: 5 * MB },
    },
    isLeak: true,
    node: null,
    totalAfter: '50 MB',
    totalBefore: '40 MB',
    usedAfter: '35 MB',
    usedBefore: '30 MB',
  })
})

test('compareHeapUsage reports fields the runtime omits as null', async () => {
  const result = await CompareHeapUsage.compareHeapUsage({ totalSize: 4 * MB, usedSize: 2 * MB }, { totalSize: 4 * MB, usedSize: 2 * MB })
  expect(result.bytes.backingStorageSize).toEqual({ after: null, before: null, delta: null })
  expect(result.bytes.embedderHeapUsedSize).toEqual({ after: null, before: null, delta: null })
  expect(result.bytes.unusedCommittedBytes).toEqual({ after: 2 * MB, before: 2 * MB, delta: 0 })
  expect(result.isLeak).toBe(false)
})

test('compareHeapUsage keeps the string-based isLeak comparison', async () => {
  // Characterization: '9.9 MB' > '10 MB' as strings, so a shrinking heap is reported as a leak.
  const result = await CompareHeapUsage.compareHeapUsage(
    { totalSize: 20 * MB, usedSize: 10 * MB },
    { totalSize: 20 * MB, usedSize: 9.9 * MB },
  )
  expect(result.usedBefore).toBe('10 MB')
  expect(result.usedAfter).toBe('9.9 MB')
  expect(result.isLeak).toBe(true)
})

test('compareHeapUsage includes node statistics only when both snapshots have them', async () => {
  const node = {
    heapSpaces: [{ physical_space_size: 1, space_name: 'old_space', space_size: 2, space_used_size: 1 }],
    heapStatistics: {
      external_memory: 1,
      malloced_memory: 2,
      number_of_detached_contexts: 0,
      number_of_native_contexts: 1,
      peak_malloced_memory: 3,
      total_global_handles_size: 4,
      total_physical_size: 5,
      used_global_handles_size: 6,
    },
  }
  const withNode = await CompareHeapUsage.compareHeapUsage({ node, totalSize: 2, usedSize: 1 }, { node, totalSize: 2, usedSize: 1 })
  expect(withNode.node).toEqual({ after: node, before: node })
  const partial = await CompareHeapUsage.compareHeapUsage({ node, totalSize: 2, usedSize: 1 }, { node: null, totalSize: 2, usedSize: 1 })
  expect(partial.node).toBeNull()
})
