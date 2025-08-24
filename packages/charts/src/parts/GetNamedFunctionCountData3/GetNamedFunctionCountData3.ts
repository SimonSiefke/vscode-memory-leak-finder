import { existsSync } from 'node:fs'
import { join } from 'path'
import { readJson } from '../ReadJson/ReadJson.ts'
import * as Root from '../Root/Root.ts'

const getCount = async (file: string, name: string): Promise<number> => {
  const data = await readJson(file)
  for (const item of data.namedFunctionCount3) {
    if (item.name === name) {
      return item.count
    }
  }
  return -1
}

export const getNamedFunctionCountData3 = async (name: string) => {
  const resultsPath = join(Root.root, '.vscode-memory-leak-finder-results', 'named-function-count3')
  if (!existsSync(resultsPath)) {
    return []
  }

  const before = join(resultsPath, 'editor.no-autofixes-available.json')
  const after = join(resultsPath, 'editor.no-autofixes-available-after.json')
  const countBefore = await getCount(before, name)
  const countAfter = await getCount(after, name)
  console.log({ countBefore, countAfter })
  const data = [
    {
      name: '1',
      count: countBefore,
      index: 0,
    },
    {
      name: '2',
      count: countAfter,
      index: 1,
    },
  ]
  return data
}
