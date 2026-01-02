import { existsSync } from 'node:fs'
import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'

export const findPromiseStackTraceFolders = async (basePath: string): Promise<string[]> => {
  const folders: string[] = []
  if (!existsSync(basePath)) {
    return folders
  }

  const dirents = await readdir(basePath)
  for (const dirent of dirents) {
    const fullPath = join(basePath, dirent)
    const stats = await stat(fullPath)
    if (stats.isDirectory()) {
      // Check if folder name contains "promises-with-stack-traces" or "promisesWithStackTrace"
      const lowerName = dirent.toLowerCase()
      if (
        lowerName.includes('promises-with-stack-traces') ||
        lowerName.includes('promiseswithstacktrace') ||
        lowerName === 'promiseswithstacktrace'
      ) {
        folders.push(fullPath)
      } else {
        // Recursively search subdirectories
        const subFolders = await findPromiseStackTraceFolders(fullPath)
        folders.push(...subFolders)
      }
    }
  }

  return folders
}

