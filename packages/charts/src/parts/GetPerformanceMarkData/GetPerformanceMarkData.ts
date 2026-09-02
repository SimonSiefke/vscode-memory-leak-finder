import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { readJson } from '../ReadJson/ReadJson.ts'

interface Comparison {
  readonly after?: number
  readonly before?: number
}

export const getPerformanceMarkData = async (name: string, key: string, basePath: string) => {
  const resultsPath = join(basePath, name)
  if (!existsSync(resultsPath)) {
    return []
  }
  const dirents = await readdir(resultsPath)
  const allData: any[] = []
  for (const dirent of dirents) {
    const rawData = await readJson(join(resultsPath, dirent))
    const comparison: Comparison = rawData[key] || {}
    const after = comparison.after ?? 0
    const before = comparison.before ?? 0
    allData.push({
      data: [
        {
          count: after,
          delta: after - before,
          name: 'PerformanceMark',
        },
      ],
      filename: dirent.replace(/\.json$/, ''),
    })
  }
  return allData
}
