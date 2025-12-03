import { glob, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import * as ExtractSourceMapUrls from '../ExtractSourceMapUrls/ExtractSourceMapUrls.ts'

export const collectSourceMapUrls = async (vscodePath: string): Promise<string[]> => {
  const dirName = dirname(vscodePath)
  const jsFiles = await Array.fromAsync(
    glob('**/*.js', {
      cwd: dirName,
    }),
  )
  console.log({ jsFiles, vscodePath, dirName })
  const sourceMapUrls: string[] = []
  for (const jsFile of jsFiles) {
    const jsFilePath = join(dirName, jsFile)

    try {
      await readFile(jsFilePath)
    } catch {
      console.log({ jsFilePath })
    }
    const urls = await ExtractSourceMapUrls.extractSourceMapUrls(jsFilePath)
    sourceMapUrls.push(...urls)
  }
  return sourceMapUrls
}
