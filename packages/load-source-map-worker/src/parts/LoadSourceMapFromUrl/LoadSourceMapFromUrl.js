import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { downloadSourceMap } from '../DownloadSourceMap/DownloadSourceMap.js'
import * as Hash from '../Hash/Hash.js'
import { readJson } from '../ReadJson/ReadJson.js'
import * as Root from '../Root/Root.js'
import { normalizeSourceMap } from '../NormalizeSourceMap/NormalizeSourceMap.js'

const getOutFileName = (url) => {
  const hash = Hash.hash(url)
  return `${hash}.js.map`
}

export const loadSourceMap = async (url) => {
  const outFileName = getOutFileName(url)
  const outFilePath = join(Root.root, '.vscode-source-maps', outFileName)
  const originalPath = join(Root.root, '.vscode-source-maps', outFileName + '.original')
  if (!existsSync(outFilePath)) {
    await downloadSourceMap(url, originalPath)
    await normalizeSourceMap(originalPath, outFilePath)
  }
  const data = await readJson(outFilePath)
  return data
}
