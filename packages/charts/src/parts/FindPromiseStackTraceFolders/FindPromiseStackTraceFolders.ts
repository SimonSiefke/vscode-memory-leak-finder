import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

export const findPromiseStackTraceFolders = async (basePath: string): Promise<string[]> => {
  if (!existsSync(basePath)) {
    return []
  }

  const dirents = await readdir(basePath, {
    recursive: true,
    withFileTypes: true,
  })

  const folders: string[] = []
  for (const dirent of dirents) {
    if (dirent.isDirectory()) {
      const lowerName = dirent.name.toLowerCase()
      if (
        lowerName.includes('promises-with-stack-traces') ||
        lowerName.includes('promiseswithstacktrace') ||
        lowerName === 'promiseswithstacktrace'
      ) {
        const fullPath = join(basePath, dirent.path || '', dirent.name)
        folders.push(fullPath)
      }
    }
  }

  return folders
}
