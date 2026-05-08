import { platform } from 'node:os'
import { getAllDescendantPids } from '../GetAllPids/GetAllPids.ts'
import * as ResolveProcessRootPid from '../ResolveProcessRootPid/ResolveProcessRootPid.ts'

type Dependencies = {
  readonly getAllDescendantPids: (pid: number) => Promise<readonly number[]>
  readonly getPlatform: () => NodeJS.Platform
  readonly resolveProcessRootPid: (pid: number | undefined, processRootStrategy: string) => Promise<number | undefined>
}

export const createGetProcessCount = (dependencies: Dependencies) => {
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
      return allPids.length
    } catch {
      return 0
    }
  }
}

export const getProcessCount = createGetProcessCount({
  getAllDescendantPids,
  getPlatform: platform,
  resolveProcessRootPid: ResolveProcessRootPid.resolveProcessRootPid,
})