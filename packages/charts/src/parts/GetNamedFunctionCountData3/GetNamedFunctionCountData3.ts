import { existsSync } from 'node:fs'
import { join } from 'path'
import { readJson } from '../ReadJson/ReadJson.ts'
import * as Root from '../Root/Root.ts'

export const getNamedFunctionCountData3 = async (name: string) => {
  const resultsPath = join(Root.root, '.vscode-memory-leak-finder-results', 'named-function-count3')
  if (!existsSync(resultsPath)) {
    return []
  }
  const beforePath = join(resultsPath, 'editor.no-autofixes-available-after.json')
  const rawData = await readJson(beforePath)

  const data = rawData.namedFunctionCount3.map((item) => {
    return {
      name: item.name,
      count: item.count * 1000,
    }
  })

  console.log({ data })
  return data
}
