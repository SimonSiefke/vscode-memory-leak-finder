import { glob } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import * as ExtractSourceMapUrls from '../ExtractSourceMapUrls/ExtractSourceMapUrls.ts'

export const collectSourceMapUrls = async (vscodePath: string): Promise<string[]> => {
  const dirName = dirname(vscodePath)
  const jsEntries = await Array.fromAsync(
    glob('**/*.js', {
      cwd: dirName,
      withFileTypes: true,
    }),
  )
  const jsFiles = jsEntries.filter((item) => item.isFile()).map((item) => join(item.parentPath, item.name))
  const sourceMapUrls: string[] = []
  for (const jsFile of jsFiles) {
    const urls = await ExtractSourceMapUrls.extractSourceMapUrls(jsFile)
    sourceMapUrls.push(...urls)
  }
  return sourceMapUrls
}
