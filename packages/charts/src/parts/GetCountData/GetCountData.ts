import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'path'
import * as ReadJson from '../ReadJson/ReadJson.ts'

export const getCountData = async (name: string, key: string, basePath: string): Promise<any[]> => {
  const resultsPath = join(basePath, name)
  if (!existsSync(resultsPath)) {
    return []
  }
  const dirents = await readdir(resultsPath)
  const allData: any[] = []
  let index = 0
  for (const dirent of dirents) {
    const absolutePath = join(resultsPath, dirent)
    const data = await ReadJson.readJson(absolutePath)
    allData.push({
      name: dirent,
      count: data[key]?.after || 0,
      index: index++,
    })
  }
  return allData
}
