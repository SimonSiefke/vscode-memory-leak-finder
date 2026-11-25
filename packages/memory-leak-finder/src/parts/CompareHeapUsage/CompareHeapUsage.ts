import type { HeapUsage } from '../GetHeapUsage/GetHeapUsage.ts'
import type { NodeV8Heap } from '../GetNodeV8HeapStatistics/GetNodeV8HeapStatistics.ts'
import * as FormatMemory from '../FormatMemory/FormatMemory.ts'

export interface HeapUsageSnapshot extends HeapUsage {
  readonly node?: NodeV8Heap | null
}

export interface HeapUsageBytes {
  readonly after: number | null
  readonly before: number | null
  readonly delta: number | null
}

const toBytes = (value: unknown): number | null => {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

const getUnusedCommittedBytes = (heapUsage: HeapUsage): number | null => {
  const totalSize = toBytes(heapUsage.totalSize)
  const usedSize = toBytes(heapUsage.usedSize)
  if (totalSize === null || usedSize === null) {
    return null
  }
  return totalSize - usedSize
}

const compareBytes = (before: number | null, after: number | null): HeapUsageBytes => {
  return {
    after,
    before,
    delta: before === null || after === null ? null : after - before,
  }
}

const compareField = (before: HeapUsage, after: HeapUsage, key: keyof HeapUsage): HeapUsageBytes => {
  return compareBytes(toBytes(before[key]), toBytes(after[key]))
}

export const compareHeapUsage = async (before: HeapUsageSnapshot, after: HeapUsageSnapshot) => {
  const usedBefore = await FormatMemory.formatMemory(before.usedSize)
  const totalBefore = await FormatMemory.formatMemory(before.totalSize)
  const usedAfter = await FormatMemory.formatMemory(after.usedSize)
  const totalAfter = await FormatMemory.formatMemory(after.totalSize)
  return {
    bytes: {
      backingStorageSize: compareField(before, after, 'backingStorageSize'),
      embedderHeapUsedSize: compareField(before, after, 'embedderHeapUsedSize'),
      totalSize: compareField(before, after, 'totalSize'),
      unusedCommittedBytes: compareBytes(getUnusedCommittedBytes(before), getUnusedCommittedBytes(after)),
      usedSize: compareField(before, after, 'usedSize'),
    },
    // Compares the formatted strings, as before; kept for result compatibility.
    isLeak: usedAfter > usedBefore,
    node: before.node && after.node ? { after: after.node, before: before.node } : null,
    totalAfter,
    totalBefore,
    usedAfter,
    usedBefore,
  }
}
