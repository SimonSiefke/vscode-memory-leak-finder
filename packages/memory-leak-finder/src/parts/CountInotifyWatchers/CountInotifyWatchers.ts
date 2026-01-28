import { readdir, readFile } from 'node:fs/promises'

export const countInotifyWatchers = async (pid: number): Promise<number> => {
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
