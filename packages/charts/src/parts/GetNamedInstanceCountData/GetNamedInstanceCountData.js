import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'path'
import * as Root from '../Root/Root.js'

export const getNamedInstanceCountData = async () => {
  const resultsPath = join(Root.root, '.vscode-memory-leak-finder-results', 'named-function-count2')
  if (!existsSync(resultsPath)) {
    console.log('no result')
    return []
  }
  const allData = []
  const file = join(resultsPath, '0.json')
  const text = await await readFile(file, 'utf8')
  const data = JSON.parse(text)
  const instance = data.namedFunctionCount2.find((item) => item.name === 'FocusTracker')
  const initial = instance.count - instance.delta
  const after = instance.count

  allData.push({
    name: 'FocusTracker',
    count: initial,
    index: 0,
  })
  allData.push({
    name: 'FocusTracker',
    count: after,
    index: 1,
  })
  console.log({ allData })
  return allData
}
