import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

export const loadSourceMap = async (url: string): Promise<any> => {
  const path = fileURLToPath(url)
  const content = await readFile(path, 'utf8')
  const data = JSON.parse(content)
  return data
}
