import type { FileDescriptorInfo } from '../FileDescriptorInfo/FileDescriptorInfo.ts'
import type { ProcessInfoWithDescriptors } from '../ProcessInfoWithDescriptors/ProcessInfoWithDescriptors.ts'

export interface FileDescriptorGroup {
  target: string
  count: number
}

export interface FileDescriptorDelta {
  name: string
  count: number
  delta: number
  pid: number
  newFileDescriptors?: FileDescriptorGroup[]
}

const isExcludedPath = (target: string): boolean => {
  // Exclude irrelevant folders from measurement
  const excludedPatterns = [
    'Dictionaries',
    'Local Storage',
    'dmabuf',
    'SharedStorage',
    'nssdb',
    'systemd',
    'memfs',
  ]

  // Also exclude /dev paths except /dev/ptmx and /dev/udmabuf which are handled separately
  if (target.startsWith('/dev/') && target !== '/dev/ptmx' && target !== '/dev/udmabuf') {
    return true
  }

  return excludedPatterns.some((pattern) => target.includes(pattern))
}

const groupFileDescriptors = (fileDescriptors: FileDescriptorInfo[]): FileDescriptorGroup[] => {
  const groups = new Map<string, number>()

  for (const fd of fileDescriptors) {
    const { target } = fd

    // Skip excluded paths
    if (isExcludedPath(target)) {
      continue
    }

    // Normalize the target by removing unique identifiers
    let groupKey: string

    if (target.startsWith('pipe:[')) {
      groupKey = 'pipe'
    } else if (target.startsWith('socket:[')) {
      groupKey = 'socket'
    } else if (target.startsWith('anon_inode:[')) {
      // Keep the anon_inode type
      groupKey = target
    } else if (target.startsWith('/memfd:')) {
      groupKey = 'memfd'
    } else if (target.startsWith('/dmabuf')) {
      groupKey = 'dmabuf'
    } else if (target === '/dev/ptmx' || target === '/dev/udmabuf') {
      groupKey = target
    } else if (target.startsWith('/tmp/.org.chromium.Chromium.')) {
      groupKey = '/tmp/.org.chromium.Chromium.* (deleted)'
    } else if (target === '<unavailable>') {
      groupKey = '<unavailable>'
    } else {
      // For regular files, keep the full path
      groupKey = target
    }

    groups.set(groupKey, (groups.get(groupKey) || 0) + 1)
  }

  // Convert to array and sort by count (descending)
  const result: FileDescriptorGroup[] = []
  for (const [target, count] of groups.entries()) {
    result.push({ target, count })
  }

  result.sort((a, b) => b.count - a.count)

  return result
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
          result.newFileDescriptors = groupFileDescriptors(newFds)
        }
      } else {
        // If there's no before state, all current FDs are "new"
        result.newFileDescriptors = groupFileDescriptors(item.fileDescriptors)
      }

      deltas.push(result)
    }
  }

  // Sort by highest delta (descending)
  const sorted = deltas.toSorted((a, b) => b.delta - a.delta)

  return sorted
}
