import { exec } from 'node:child_process'
import { readdir, readFile } from 'node:fs/promises'
import { platform } from 'node:os'
import { promisify } from 'node:util'
import * as Assert from '../Assert/Assert.ts'

const execAsync = promisify(exec)

const getChildPids = async (pid: number): Promise<readonly number[]> => {
  try {
    const { stdout } = await execAsync(`pgrep -P ${pid}`)
    const childPids = stdout
      .trim()
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => Number.parseInt(line.trim(), 10))
      .filter((pid) => !Number.isNaN(pid))
    return childPids
  } catch (error) {
    return []
  }
}

const getAllDescendantPids = async (pid: number): Promise<readonly number[]> => {
  const allPids: number[] = [pid]
  const childPids = await getChildPids(pid)
  for (const childPid of childPids) {
    const descendants = await getAllDescendantPids(childPid)
    allPids.push(...descendants)
  }
  return allPids
}

const countInotifyWatchers = async (pid: number): Promise<number> => {
  try {
    const fdDir = `/proc/${pid}/fdinfo`
    const files = await readdir(fdDir)
    let count = 0
    for (const file of files) {
      try {
        const content = await readFile(`${fdDir}/${file}`, 'utf8')
        if (content.includes('inotify')) {
          count++
        }
      } catch {
        // ignore errors reading individual files
      }
    }
    return count
  } catch {
    return 0
  }
}

export const getFileWatcherCount = async (pid: number): Promise<number> => {
  Assert.number(pid)
  console.log({ pid })
  if (pid === undefined) {
    return 0
  }
  if (platform() !== 'linux') {
    return 0
  }
  try {
    const allPids = await getAllDescendantPids(pid)
    console.log({ allPids })
    let totalCount = 0
    for (const processPid of allPids) {
      const count = await countInotifyWatchers(processPid)
      console.log({ count, processPid })
      totalCount += count
    }
    return totalCount
  } catch {
    return 0
  }
}
