import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'url'

export const loadSourceMap = async (url) => {
  const path = fileURLToPath(url)
  const content = await readFile(path, 'utf8')
  const data = JSON.parse(content)
  return data
}
