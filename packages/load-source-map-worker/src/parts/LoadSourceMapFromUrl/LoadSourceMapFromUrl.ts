import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { downloadSourceMap } from '../DownloadSourceMap/DownloadSourceMap.js'
import { normalizeSourceMap } from '../NormalizeSourceMap/NormalizeSourceMap.js'
import { readJson } from '../ReadJson/ReadJson.js'
import * as Root from '../Root/Root.js'

export const loadSourceMap = async (url: string, hash: string): Promise<any> => {
  const outFileName = `${hash}.js.map`
  const outFilePath = join(Root.root, '.vscode-source-maps', outFileName)
  const originalPath = join(Root.root, '.vscode-source-maps', outFileName + '.original')
  if (!existsSync(outFilePath)) {
    await downloadSourceMap(url, originalPath)
    await normalizeSourceMap(originalPath, outFilePath)
  }
  const data = await readJson(outFilePath)
  return data
}
