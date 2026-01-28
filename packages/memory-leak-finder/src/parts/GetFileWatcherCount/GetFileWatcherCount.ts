import { platform } from 'node:os'
import { getAllDescendantPids } from '../GetAllPids/GetAllPids.ts'
import { countInotifyWatchers } from '../CountInotifyWatchers/CountInotifyWatchers.ts'

export const getFileWatcherCount = async (pid: number | undefined): Promise<number> => {
  console.log({ pid })
  if (pid === undefined) {
    return 0
  }
  if (platform() !== 'linux') {
    return 0
  }
  try {
    const allPids = await getAllDescendantPids(pid)
    let totalCount = 0
    for (const processPid of allPids) {
      const count = await countInotifyWatchers(processPid)
      totalCount += count
    }
    return totalCount
  } catch {
    return 0
  }
}
