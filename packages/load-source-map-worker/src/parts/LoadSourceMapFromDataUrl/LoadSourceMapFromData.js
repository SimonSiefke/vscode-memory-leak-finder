import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { normalizeSourceMap } from '../NormalizeSourceMap/NormalizeSourceMap.js'
import * as Root from '../Root/Root.js'
import { readJson } from '../ReadJson/ReadJson.js'

const prefix = 'data:application/json;base64,'

export const loadSourceMap = async (dataUrl, hash) => {
  if (!dataUrl.startsWith(prefix)) {
    throw new Error(`only json data urls are supported`)
  }
  const rest = dataUrl.slice(prefix.length)
  const restString = Buffer.from(rest, 'base64').toString()
  const data = JSON.parse(restString)
  const outFileName = `${hash}.js.map`
  const outFilePath = join(Root.root, '.vscode-source-maps', outFileName)
  const originalPath = join(Root.root, '.vscode-source-maps', outFileName + '.original')
  if (!existsSync(outFilePath)) {
    await mkdir(dirname(originalPath), { recursive: true })
    await writeFile(originalPath, JSON.stringify(data))
    await normalizeSourceMap(originalPath, outFilePath)
  }
  const newData = await readJson(outFilePath)
  return newData
}
