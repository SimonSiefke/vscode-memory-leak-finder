import * as FormatMemory from '../FormatMemory/FormatMemory.ts'
import type { HeapUsage } from '../GetHeapUsage/GetHeapUsage.ts'

export const compareHeapUsage = async (before: HeapUsage, after: HeapUsage) => {
  const usedBefore = await FormatMemory.formatMemory(before.usedSize)
  const totalBefore = await FormatMemory.formatMemory(before.totalSize)
  const usedAfter = await FormatMemory.formatMemory(after.usedSize)
  const totalAfter = await FormatMemory.formatMemory(after.totalSize)
  return {
    usedBefore,
    usedAfter,
    totalBefore,
    totalAfter,
    isLeak: usedAfter > usedBefore,
  }
}
