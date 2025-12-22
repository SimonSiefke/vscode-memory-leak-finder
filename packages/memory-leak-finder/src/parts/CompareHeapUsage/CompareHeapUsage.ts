import type { HeapUsage } from '../GetHeapUsage/GetHeapUsage.ts'
import * as FormatMemory from '../FormatMemory/FormatMemory.ts'

export const compareHeapUsage = async (before: HeapUsage, after: HeapUsage) => {
  const usedBefore = await FormatMemory.formatMemory(before.usedSize)
  const totalBefore = await FormatMemory.formatMemory(before.totalSize)
  const usedAfter = await FormatMemory.formatMemory(after.usedSize)
  const totalAfter = await FormatMemory.formatMemory(after.totalSize)
  return {
    isLeak: usedAfter > usedBefore,
    totalAfter,
    totalBefore,
    usedAfter,
    usedBefore,
    isLeak: usedAfter > usedBefore,
  }
}
