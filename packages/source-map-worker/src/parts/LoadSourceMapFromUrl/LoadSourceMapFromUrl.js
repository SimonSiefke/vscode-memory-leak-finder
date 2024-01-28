import { createWriteStream, existsSync } from 'node:fs'
import { mkdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import got from 'got'
import * as Hash from '../Hash/Hash.js'
import * as Root from '../Root/Root.js'

const getOutFileName = (url) => {
  const hash = Hash.hash(url)
  return `${hash}.js.map`
}

export const loadSourceMap = async (url) => {
  const outFileName = getOutFileName(url)
  const outFilePath = join(Root.root, '.vscode-source-maps', outFileName)
  if (!existsSync(outFilePath)) {
    await mkdir(dirname(outFilePath), { recursive: true })
    await pipeline(got.stream(url), createWriteStream(outFilePath))
  }
  const content = await readFile(outFilePath, 'utf8')
  const data = JSON.parse(content)
  return data
}
