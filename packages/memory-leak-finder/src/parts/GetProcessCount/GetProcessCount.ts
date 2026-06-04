import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { getAllDescendantPids } from '../GetAllPids/GetAllPids.ts'
import { root } from '../Root/Root.ts'

const sshdPidPath = join(root, '.vscode-user-data-dir', 'remote-ssh', 'sshd.pid')

const parsePid = (text: string): number | undefined => {
  const pid = Number(text.trim())
  if (!Number.isFinite(pid)) {
    return undefined
  }
  return pid
}

const isProcessAlive = (pid: number): boolean => {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    return error && typeof error === 'object' && 'code' in error && error.code === 'EPERM'
  }
}

const getSshdPid = async (): Promise<number | undefined> => {
  try {
    const text = await readFile(sshdPidPath, 'utf8')
    return parsePid(text)
  } catch {
    return undefined
  }
}

export const getProcessCountForRoots = async (
  rootPids: readonly number[],
  getDescendantPids: (pid: number) => Promise<readonly number[]> = getAllDescendantPids,
  isAlive: (pid: number) => boolean = isProcessAlive,
): Promise<number> => {
  const allPids = new Set<number>()
  for (const rootPid of rootPids) {
    if (!Number.isFinite(rootPid) || !isAlive(rootPid)) {
      continue
    }
    const descendants = await getDescendantPids(rootPid)
    for (const descendant of descendants) {
      if (isAlive(descendant)) {
        allPids.add(descendant)
      }
    }
  }
  return allPids.size
}

export const getProcessCount = async (pid: number | undefined): Promise<number> => {
  if (pid === undefined) {
    return 0
  }
  const sshdPid = await getSshdPid()
  const rootPids = sshdPid === undefined ? [pid] : [pid, sshdPid]
  return getProcessCountForRoots(rootPids)
}
