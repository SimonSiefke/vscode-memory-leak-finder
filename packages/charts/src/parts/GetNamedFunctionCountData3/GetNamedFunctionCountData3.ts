import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { readJson } from '../ReadJson/ReadJson.ts'

const ANONYMOUS_NAME = 'anonymous'
const LOCATION_SUFFIX_REGEX = /:\d+:\d+$/

type NamedFunctionCount = {
  readonly count?: number
  readonly delta?: number
  readonly name?: string
  readonly originalLocation?: string
  readonly originalName?: string
  readonly sourceLocation?: string
}

const getUniqueName = (usedNames: Set<string>, currentName: string): string => {
  let uniqueName = currentName
  let counter = 2

  while (usedNames.has(uniqueName)) {
    uniqueName = `${currentName} (${counter})`
    counter++
  }

  return uniqueName
}

const getAnonymousFileName = (item: NamedFunctionCount): string => {
  const location = item.originalLocation || item.sourceLocation || ''
  const normalizedLocation = location.replaceAll('\\', '/').replace(LOCATION_SUFFIX_REGEX, '')
  return basename(normalizedLocation)
}

const getBaseName = (item: NamedFunctionCount): string => {
  const baseName = item.originalName || item.name || ''
  if (baseName !== ANONYMOUS_NAME) {
    return baseName
  }
  const fileName = getAnonymousFileName(item)
  return fileName ? `${ANONYMOUS_NAME} (${fileName})` : ANONYMOUS_NAME
}

export const getNamedFunctionCountData3 = async (name: string, basePath: string) => {
  const resultsPath = join(basePath, 'named-function-count3')
  if (!existsSync(resultsPath)) {
    return []
  }
  const dirents = await readdir(resultsPath)
  const allData: any[] = []
  for (const dirent of dirents) {
    const beforePath = join(resultsPath, dirent)
    const rawData = await readJson(beforePath)
    const usedNames = new Set<string>()
    const data = (rawData.namedFunctionCount3 || []).map((item: NamedFunctionCount) => {
      const baseName = getBaseName(item)
      const uniqueName = getUniqueName(usedNames, baseName)
      usedNames.add(uniqueName)

      return {
        count: item.count,
        delta: item.delta,
        name: uniqueName,
      }
    })
    data.sort((a: { count: number }, b: { count: number }) => b.count - a.count)
    // Add filename metadata to the data
    const dataWithFilename = {
      data,
      filename: dirent.replace('.json', ''),
    }
    allData.push(dataWithFilename)
  }
  return allData
}
