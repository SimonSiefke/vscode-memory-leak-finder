import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import * as ReadJson from '../ReadJson/ReadJson.ts'

export const getObjectUrlCountData = async (basePath: string): Promise<any[]> => {
  const resultsPath = join(basePath, 'object-url-count')
  if (!existsSync(resultsPath)) {
    return []
  }

  const dirents = await readdir(resultsPath)
  const allData: any[] = []
  for (const [index, dirent] of dirents.toSorted().entries()) {
    const absolutePath = join(resultsPath, dirent)
    const data = await ReadJson.readJson(absolutePath)
    allData.push({
      count: data.objectUrlCount?.unreleased || 0,
      index,
      name: dirent,
    })
  }
  return allData
}
