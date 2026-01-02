import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { emptySourceMap } from '../EmptySourceMap/EmptySourceMap.ts'

export const loadSourceMap = async (url: string): Promise<any> => {
  try {
    const path = fileURLToPath(url)
    const content = await readFile(path, 'utf8')
    const data = JSON.parse(content)
    return data
  } catch {
    // TODO log error? what to do here?
    return emptySourceMap
  }
}
