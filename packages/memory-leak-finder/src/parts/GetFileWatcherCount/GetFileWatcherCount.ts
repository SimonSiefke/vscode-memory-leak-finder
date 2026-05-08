import { platform } from 'node:os'
import { getAllDescendantPids } from '../GetAllPids/GetAllPids.ts'
import { countInotifyWatchers } from '../CountInotifyWatchers/CountInotifyWatchers.ts'
import * as ResolveProcessRootPid from '../ResolveProcessRootPid/ResolveProcessRootPid.ts'

type Dependencies = {
  readonly countInotifyWatchers: (pid: number) => Promise<number>
  readonly getAllDescendantPids: (pid: number) => Promise<readonly number[]>
  readonly getPlatform: () => NodeJS.Platform
  readonly resolveProcessRootPid: (pid: number | undefined, processRootStrategy: string) => Promise<number | undefined>
}

export const createGetFileWatcherCount = (dependencies: Dependencies) => {
  return async (pid: number | undefined, processRootStrategy: string): Promise<number> => {
    if (pid === undefined) {
      return 0
    }
    if (dependencies.getPlatform() !== 'linux') {
      return 0
    }
    try {
      const rootPid = await dependencies.resolveProcessRootPid(pid, processRootStrategy)
      if (rootPid === undefined) {
        return 0
      }
      const allPids = await dependencies.getAllDescendantPids(rootPid)
      let totalCount = 0
      for (const processPid of allPids) {
        const count = await dependencies.countInotifyWatchers(processPid)
        totalCount += count
      }
      return totalCount
    } catch {
      return 0
    }
  }
}

export const getFileWatcherCount = createGetFileWatcherCount({
  countInotifyWatchers,
  getAllDescendantPids,
  getPlatform: platform,
  resolveProcessRootPid: ResolveProcessRootPid.resolveProcessRootPid,
})
