import { writeFile } from 'node:fs/promises'

export const writeJson = async (path, json) => {
  const content = JSON.stringify(json, null, 2) + '\n'
  await writeFile(path, content)
}
