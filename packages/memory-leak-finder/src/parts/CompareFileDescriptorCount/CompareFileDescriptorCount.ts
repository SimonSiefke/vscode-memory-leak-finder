import type { Dynamic } from '../Types/Types.ts'
import type { ProcessInfo } from '../GetFileDescriptorCount/GetFileDescriptorCount.ts'
export const compareFileDescriptorCount = (
  before: ProcessInfo[],
  after: ProcessInfo[],
  context: Dynamic,
): Array<{
  name: string
  count: number
  delta: number
}> => {
  // Create a map of before counts by name for easy lookup
  const beforeMap = new Map<string, number>()
  for (const item of before) {
    beforeMap.set(item.name, item.fileDescriptorCount)
  }
  // Calculate deltas for each item in after
  const deltas: Array<{
    name: string
    count: number
    delta: number
  }> = []
  for (const item of after) {
    const beforeCount = beforeMap.get(item.name) || 0
    const delta = item.fileDescriptorCount - beforeCount
    // Only include items with delta >= context.runs
    if (delta >= context.runs) {
      deltas.push({
        count: item.fileDescriptorCount,
        delta,
        name: item.name,
      })
    }
  }
  // Sort by highest delta (descending)
  const sorted = deltas.toSorted((a: Dynamic, b: Dynamic) => b.delta - a.delta)
  return sorted
}
