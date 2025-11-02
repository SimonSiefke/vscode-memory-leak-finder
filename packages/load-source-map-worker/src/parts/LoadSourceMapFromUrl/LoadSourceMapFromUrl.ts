import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { downloadSourceMap } from '../DownloadSourceMap/DownloadSourceMap.ts'
import { normalizeSourceMap } from '../NormalizeSourceMap/NormalizeSourceMap.ts'
import { readJson } from '../ReadJson/ReadJson.ts'
import * as Root from '../Root/Root.ts'
import { writeFile } from 'node:fs/promises'
import { emptySourceMap } from '../EmptySourceMap/EmptySourceMap.ts'

const isNotFoundError = (error) => {
  return error && error.message && (error.message.includes('Response code 404') || error.message.includes('status code 404'))
}

export const loadSourceMap = async (url: string, hash: string): Promise<any> => {
  const outFileName = `${hash}.js.map`
  const outFilePath = join(Root.root, '.vscode-source-maps', outFileName)
  const originalPath = join(Root.root, '.vscode-source-maps', outFileName + '.original')
  if (!existsSync(outFilePath)) {
    try {
      await downloadSourceMap(url, originalPath)
      await normalizeSourceMap(originalPath, outFilePath)
    } catch (error) {
      if (isNotFoundError(error)) {
        await writeFile(outFilePath, JSON.stringify(emptySourceMap))
      } else {
        throw error
      }
    }
  }
  const data = await readJson(outFilePath)
  return data
}
