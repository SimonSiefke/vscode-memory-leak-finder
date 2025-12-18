import { readFile } from 'node:fs/promises'

export const readJson = async (path: string): Promise<any> => {
  const content = await readFile(path, 'utf8')
  const data = JSON.parse(content)
  return data
}
