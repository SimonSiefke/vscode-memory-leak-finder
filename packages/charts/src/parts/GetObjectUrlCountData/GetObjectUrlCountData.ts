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
  for (const dirent of dirents.toSorted()) {
    const absolutePath = join(resultsPath, dirent)
    const data = await ReadJson.readJson(absolutePath)
    allData.push({
      data: [
        {
          count: data.objectUrlCount?.created || 0,
          delta: data.objectUrlCount?.unreleased || 0,
          name: 'Object URLs',
        },
      ],
      filename: dirent.replace(/\.json$/, ''),
    })
  }
  return allData
}
