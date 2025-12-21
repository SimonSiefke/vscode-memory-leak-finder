import { readFile } from 'node:fs/promises'

const SOURCE_MAP_URL_REGEX = /\/\/[#@]\s*sourceMappingURL\s*=\s*(.+)/

export const extractSourceMapUrls = async (jsFilePath: string): Promise<string[]> => {
  const content = await readFile(jsFilePath, 'utf8')
  const lines = content.split('\n')
  const sourceMapUrls: string[] = []
  // Sourcemap URL is always the very last line or the second to last line
  const lastLine = lines[lines.length - 1]
  const secondToLastLine = lines.length > 1 ? lines[lines.length - 2] : null
  const linesToCheck = secondToLastLine ? [secondToLastLine, lastLine] : [lastLine]
  for (const line of linesToCheck) {
    const match = line.match(SOURCE_MAP_URL_REGEX)
    if (match) {
      const url = match[1].trim()
      if (url) {
        sourceMapUrls.push(url)
      }
    }
  }
  return sourceMapUrls
}
