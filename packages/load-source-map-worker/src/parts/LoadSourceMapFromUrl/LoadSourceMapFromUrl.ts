import { existsSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { downloadSourceMap } from '../DownloadSourceMap/DownloadSourceMap.ts'
import { emptySourceMap } from '../EmptySourceMap/EmptySourceMap.ts'
import { isNotFoundOrNotAvailableMessage } from '../IsNotFoundOrNotAvailableMessage/IsNotFoundOrNotAvailableMessage.ts'
import { normalizeSourceMap } from '../NormalizeSourceMap/NormalizeSourceMap.ts'
import { readJson } from '../ReadJson/ReadJson.ts'
import * as Root from '../Root/Root.ts'

const isNotFoundOrNotAvailableError = (error: unknown): boolean => {
  return Boolean(error && error instanceof Error && isNotFoundOrNotAvailableMessage(error.message))
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
      if (isNotFoundOrNotAvailableError(error)) {
        await writeFile(outFilePath, JSON.stringify(emptySourceMap))
      } else {
        throw error
      }
    }
  } else if (existsSync(originalPath)) {
    // The normalized map and extracted sources are cached separately. Rebuild
    // the extracted files from the original map when the normalized cache hits
    // so a partial source cache restore cannot leave reports without frames.
    await normalizeSourceMap(originalPath, outFilePath)
  }
  const data = await readJson(outFilePath)
  return data
}
