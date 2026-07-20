import { getOriginalConstructorNameFromFile } from '../GetOriginalConstructorNameFromFile/GetOriginalConstructorNameFromFile.ts'

export const getOriginalConstructorNameFromFiles = async (items: readonly any[]): Promise<readonly string[]> => {
  const mapped: string[] = []
  for (const item of items) {
    const resolved = await getOriginalConstructorNameFromFile(item.codePath, item.line, item.column)
    mapped.push(resolved)
  }
  return mapped
}
