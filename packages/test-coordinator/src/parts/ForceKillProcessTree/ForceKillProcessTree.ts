import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'
import * as IsIgnoredProcessKillError from '../IsIgnoredProcessKillError/IsIgnoredProcessKillError.ts'
import * as Root from '../Root/Root.ts'

const execFileAsync = promisify(execFile)

const kill = (pid: number): void => {
  try {
    process.kill(pid, 'SIGKILL')
  } catch (error) {
    if (!IsIgnoredProcessKillError.isIgnoredProcessKillError(error)) {
      throw error
    }
  }
}

const getDescendants = (output: string, rootPid: number): readonly number[] => {
  const childrenByParent = new Map<number, number[]>()
  for (const line of output.split('\n')) {
    const [pidValue, parentPidValue] = line.trim().split(/\s+/)
    const pid = Number.parseInt(pidValue)
    const parentPid = Number.parseInt(parentPidValue)
    if (!Number.isFinite(pid) || !Number.isFinite(parentPid)) {
      continue
    }
    const children = childrenByParent.get(parentPid) || []
    children.push(pid)
    childrenByParent.set(parentPid, children)
  }
  const descendants: number[] = []
  const visit = (parentPid: number): void => {
    for (const childPid of childrenByParent.get(parentPid) || []) {
      visit(childPid)
      descendants.push(childPid)
    }
  }
  visit(rootPid)
  return descendants
}

export const forceKillProcessTree = async (pid: number): Promise<void> => {
  if (!pid) {
    return
  }
  if (process.platform === 'win32') {
    try {
      await execFileAsync('taskkill', ['/pid', String(pid), '/t', '/f'])
    } catch {
      kill(pid)
    }
    return
  }
  try {
    const { stdout } = await execFileAsync('ps', ['-e', '-o', 'pid=', '-o', 'ppid='], {
      timeout: 5000,
    })
    for (const descendantPid of getDescendants(stdout, pid)) {
      kill(descendantPid)
    }
  } catch (error) {
    console.error(`failed to enumerate descendants of process ${pid}`, error)
  }
  kill(pid)
}

export const forceKillProcessTreeFromLock = async (): Promise<void> => {
  try {
    const lockPath = join(Root.root, '.vscode-user-data-dir', 'code.lock')
    const content = await readFile(lockPath, 'utf8')
    const pid = Number.parseInt(content)
    if (Number.isFinite(pid)) {
      await forceKillProcessTree(pid)
    }
  } catch (error) {
    if (!IsIgnoredProcessKillError.isIgnoredProcessKillError(error)) {
      throw error
    }
  }
}
