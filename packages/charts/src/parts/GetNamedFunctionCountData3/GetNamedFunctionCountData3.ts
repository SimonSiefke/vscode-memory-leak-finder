import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'path'
import { readJson } from '../ReadJson/ReadJson.ts'
import * as Root from '../Root/Root.ts'

export const getNamedFunctionCountData3 = async (name: string) => {
  const resultsPath = join(Root.root, '.vscode-memory-leak-finder-results', 'named-function-count3')
  if (!existsSync(resultsPath)) {
    return []
  }
  const dirents = await readdir(resultsPath)
  const allData: any[] = []
  for (const dirent of dirents) {
    const beforePath = join(resultsPath, dirent)
    const rawData = await readJson(beforePath)
    const data = rawData.namedFunctionCount3.map((item) => {
      return {
        name: item.originalName || item.name,
        value: item.count,
      }
    })
    data.sort((a, b) => b.value - a.value)
    allData.push(data)
  }
  return allData
}
