import { exec } from 'node:child_process'
import { readdir, readFile } from 'node:fs/promises'
import { platform } from 'node:os'
import { promisify } from 'node:util'
import { getAllDescendantPids } from '../GetAllPids/GetAllPids.ts'

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
