import { readFile } from 'node:fs/promises'

export const readJson = async (filePath: string): Promise<any> => {
  const content = await readFile(filePath, 'utf8')
  const data = JSON.parse(content)
  return data
}
