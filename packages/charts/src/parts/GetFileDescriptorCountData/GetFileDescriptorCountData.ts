import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { readJson } from '../ReadJson/ReadJson.ts'

interface FileDescriptorCountItem {
  readonly count?: number
  readonly delta?: number
  readonly name?: string
}

export const getFileDescriptorCountData = async (basePath: string) => {
  const resultsPath = join(basePath, 'file-descriptor-count')
  if (!existsSync(resultsPath)) {
    return []
  }

  const dirents = (await readdir(resultsPath)).toSorted()
  const allData = []
  for (const dirent of dirents) {
    const filePath = join(resultsPath, dirent)
    const rawData = await readJson(filePath)
    const data = ((rawData.fileDescriptorCount || []) as FileDescriptorCountItem[]).map((item) => {
      return {
        count: item.count ?? 0,
        delta: item.delta ?? 0,
        name: item.name ?? '',
      }
    })
    data.sort((a, b) => b.count - a.count)
    allData.push({
      data,
      filename: dirent.replace('.json', ''),
    })
  }
  return allData
}
