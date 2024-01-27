import { createWriteStream, existsSync } from 'fs'
import { mkdir, readFile } from 'fs/promises'
import got from 'got'
import { dirname, join } from 'path'
import { pipeline } from 'stream/promises'
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
