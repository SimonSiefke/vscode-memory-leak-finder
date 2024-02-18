import * as FormatMemory from '../FormatMemory/FormatMemory.js'

export const compareHeapUsage = async (before, after) => {
  const usedBefore = await FormatMemory.formatMemory(before.usedSize)
  const totalBefore = await FormatMemory.formatMemory(before.totalSize)
  const usedAfter = await FormatMemory.formatMemory(after.usedSize)
  const totalAfter = await FormatMemory.formatMemory(after.totalSize)
  return {
    usedBefore,
    usedAfter,
    totalBefore,
    totalAfter,
  }
}
