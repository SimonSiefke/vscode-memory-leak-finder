import got from 'got'
import { VError } from '../VError/VError.js'
import * as Root from '../Root/Root.js'
import { pipeline } from 'stream/promises'
import { createWriteStream } from 'fs'
import { dirname, join } from 'path'
import { mkdir, readFile } from 'fs/promises'

const getOutFileName = (url) => {
  const slashIndex = url.lastIndexOf('/')
  return url.slice(slashIndex)
}

export const loadSourceMap = async (url) => {
  try {
    const outFileName = getOutFileName(url)
    const outFilePath = join(Root.root, '.vscode-source-maps', outFileName)
    await mkdir(dirname(outFilePath), { recursive: true })
    await pipeline(got.stream(url), createWriteStream(outFilePath))
    const content = await readFile(outFilePath, 'utf8')
    const data = JSON.parse(content)
    return data
  } catch (error) {
    throw new VError(error, `Failed to load source map for ${url}`)
  }
}
