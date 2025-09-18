import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import * as MemoryLeakResultsPath from '../MemoryLeakResultsPath/MemoryLeakResultsPath.ts'

export const getLatestResultName = async (measure: string): Promise<string | null> => {
  const resultsPath = join(MemoryLeakResultsPath.memoryLeakResultsPath, measure)
  
  if (!existsSync(resultsPath)) {
    return null
  }
  
  const dirents = await readdir(resultsPath)
  
  if (dirents.length === 0) {
    return null
  }
  
  // Sort files by modification time (newest first)
  const filesWithStats = await Promise.all(
    dirents.map(async (dirent) => {
      const filePath = join(resultsPath, dirent)
      const stats = await import('node:fs/promises').then(fs => fs.stat(filePath))
      return {
        name: dirent,
        mtime: stats.mtime.getTime(),
      }
    })
  )
  
  filesWithStats.sort((a, b) => b.mtime - a.mtime)
  
  return filesWithStats[0].name
}
