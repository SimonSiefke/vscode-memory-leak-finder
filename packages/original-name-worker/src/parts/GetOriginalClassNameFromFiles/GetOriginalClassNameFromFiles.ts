import { getOriginalClassNameFromFile } from '../GetOriginalClassNameFromFile/GetOriginalClassNameFromFile.ts'

export const getOriginalClassNameFromFiles = async (items: readonly any[]) => {
  const mapped: string[] = []
  for (const item of items) {
    const resolved = await getOriginalClassNameFromFile(item.codePath, item.originalLine, item.originalColumn)
    mapped.push(resolved)
  }
  return mapped
}
