import { join } from 'path'
import * as Root from '../Root/Root.js'
import { readFile, readdir } from 'fs/promises'
import { existsSync } from 'fs'

export const getFunctionCountsData = async () => {
  const resultsPath = join(Root.root, '.vscode-memory-leak-finder-results', 'function-count')
  if (!existsSync(resultsPath)) {
    return []
  }
  const dirents = await readdir(resultsPath)
  const allData = []
  let index = 0
  for (const dirent of dirents) {
    const absolutePath = join(resultsPath, dirent)
    const content = await readFile(absolutePath, 'utf8')
    const data = JSON.parse(content)
    allData.push({
      name: dirent,
      count: data.functionCount.after,
      index: index++,
    })
  }
  return allData
}
