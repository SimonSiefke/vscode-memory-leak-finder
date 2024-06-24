import { existsSync } from 'node:fs'
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'path'
import * as Root from '../Root/Root.js'

export const getWeakSetCountData = async () => {
  const resultsPath = join(Root.root, '.vscode-memory-leak-finder-results', 'weak-set-count')
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
      count: data.weakMapCount.after,
      index: index++,
    })
  }
  return allData
}
