import { readFile } from 'node:fs/promises'

/**
 * @param {string} path
 * @returns {Promise<string[]>}
 */
export const getStrings = async (path) => {
  const content = await readFile(path, 'utf8')
  const originalData = JSON.parse(content)
  const { strings } = originalData
  return strings
}
