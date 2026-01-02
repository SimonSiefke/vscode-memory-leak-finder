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
        lowerName.includes('promises-with-stack-trace') ||
        lowerName.includes('promises-with-stack-traces') ||
        lowerName.includes('promiseswithstacktrace') ||
        lowerName === 'promiseswithstacktrace'
      ) {
        // @ts-ignore - path property exists on Dirent when using recursive: true
        const relativePath = dirent.path || ''
        const fullPath = relativePath ? join(basePath, relativePath, dirent.name) : join(basePath, dirent.name)
        folders.push(fullPath)
      }
    }
  }

  return folders
}

