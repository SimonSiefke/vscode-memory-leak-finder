import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'path'
import { readJson } from '../ReadJson/ReadJson.ts'
import * as Root from '../Root/Root.ts'

const getUniqueName = (usedNames: Set<string>, currentName: string): string => {
  let uniqueName = currentName
  let counter = 2

  while (usedNames.has(uniqueName)) {
    uniqueName = `${currentName} (${counter})`
    counter++
  }

  return uniqueName
}

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
    const usedNames = new Set<string>()
    const data = rawData.namedFunctionCount3.map((item) => {
      const baseName = item.originalName || item.name
      const uniqueName = getUniqueName(usedNames, baseName)
      usedNames.add(uniqueName)

      return {
        name: uniqueName,
        count: item.count,
        delta: item.delta,
      }
    })
    data.sort((a, b) => b.count - a.count)
    // Add filename metadata to the data
    const dataWithFilename = {
      data,
      filename: dirent.replace('.json', ''),
    }
    allData.push(dataWithFilename)
  }
  return allData
}
