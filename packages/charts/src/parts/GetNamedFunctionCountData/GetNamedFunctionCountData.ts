import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'path'

export const getNamedFunctionCountData = async (basePath: string) => {
  const resultsPath = join(basePath, 'named-function-count2')
  if (!existsSync(resultsPath)) {
    console.log('no result')
    return []
  }
  const allData: any[] = []
  const file = join(resultsPath, '0.json')
  const text = await readFile(file, 'utf8')
  const data = JSON.parse(text)
  // const instance = data.namedFunctionCount2.find((item) => item.name === 'FocusTracker')
  // const initial = instance.count - instance.delta
  // const after = instance.count
  for (const item of data.namedFunctionCount2) {
    const index = data.namedFunctionCount2.indexOf(item)
    allData.push({
      name: item.name + index,
      delta: item.delta,
      count: item.count,
      index: index,
    })
  }
  allData.sort((a, b) => b.delta - a.delta)
  console.log({ allData })
  return allData
}
