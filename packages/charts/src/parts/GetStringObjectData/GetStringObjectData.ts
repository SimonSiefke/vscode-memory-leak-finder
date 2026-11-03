import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { readJson } from '../ReadJson/ReadJson.ts'

export const getStringObjectData = async (name: string, key: string, basePath: string) => {
  const resultsPath = join(basePath, name)
  if (!existsSync(resultsPath)) {
    return []
  }
  const dirents = await readdir(resultsPath)
  const allData = []
  for (const dirent of dirents) {
    const rawData = await readJson(join(resultsPath, dirent))
    const comparison: { after?: number; before?: number } = rawData[key] || {}
    const after = comparison.after ?? 0
    const before = comparison.before ?? 0
    allData.push({
      data: [{ count: after, delta: after - before, name: 'String objects' }],
      filename: dirent.replace(/\.json$/, ''),
    })
  }
  return allData
}
