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
  // Process names are not unique (for example, multiple VS Code utility processes).
  // Compare the total count for each name so one process cannot overwrite another's baseline.
  const beforeMap = new Map<string, number>()
  for (const item of before) {
    beforeMap.set(item.name, (beforeMap.get(item.name) || 0) + item.fileDescriptorCount)
  }
  const afterMap = new Map<string, number>()
  for (const item of after) {
    afterMap.set(item.name, (afterMap.get(item.name) || 0) + item.fileDescriptorCount)
  }
  // Calculate deltas for each process name
  const deltas: Array<{
    name: string
    count: number
    delta: number
  }> = []
  for (const [name, count] of afterMap) {
    const beforeCount = beforeMap.get(name) || 0
    const delta = count - beforeCount
    // Only include items with delta >= context.runs
    if (delta >= context.runs) {
      deltas.push({
        count,
        delta,
        name,
      })
    }
  }
  // Sort by highest delta (descending)
  const sorted = deltas.toSorted((a: Dynamic, b: Dynamic) => b.delta - a.delta)
  return sorted
}
