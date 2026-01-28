import type { FileDescriptorInfo, ProcessInfoWithDescriptors } from '../GetFileDescriptors/GetFileDescriptors.ts'

export interface FileDescriptorDelta {
  name: string
  count: number
  delta: number
  pid: number
  newFileDescriptors?: FileDescriptorInfo[]
}

export const compareFileDescriptors = (
  before: ProcessInfoWithDescriptors[],
  after: ProcessInfoWithDescriptors[],
  context: any,
): FileDescriptorDelta[] => {
  // Create a map of before info by name for easy lookup
  const beforeMap = new Map<string, ProcessInfoWithDescriptors>()
  for (const item of before) {
    beforeMap.set(item.name, item)
  }

  // Calculate deltas for each item in after
  const deltas: FileDescriptorDelta[] = []
  for (const item of after) {
    const beforeItem = beforeMap.get(item.name)
    const beforeCount = beforeItem?.fileDescriptorCount || 0
    const delta = item.fileDescriptorCount - beforeCount

    // Only include items with delta >= context.runs
    if (delta >= context.runs) {
      const result: FileDescriptorDelta = {
        count: item.fileDescriptorCount,
        delta,
        name: item.name,
        pid: item.pid,
      }

      // Find new file descriptors that didn't exist before
      if (beforeItem?.fileDescriptors) {
        const beforeFdSet = new Set(beforeItem.fileDescriptors.map((fd) => fd.target))
        const newFds = item.fileDescriptors.filter((fd) => !beforeFdSet.has(fd.target))
        if (newFds.length > 0) {
          result.newFileDescriptors = newFds
        }
      } else {
        // If there's no before state, all current FDs are "new"
        result.newFileDescriptors = item.fileDescriptors
      }

      deltas.push(result)
    }
  }

  // Sort by highest delta (descending)
  const sorted = deltas.toSorted((a, b) => b.delta - a.delta)

  return sorted
}
