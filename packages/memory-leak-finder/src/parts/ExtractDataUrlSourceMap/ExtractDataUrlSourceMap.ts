import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import * as Root from '../Root/Root.ts'

const prefix = 'data:application/json;base64,'

export const isDataUrl = (url: string | undefined): boolean => {
  return url !== undefined && url.startsWith(prefix)
}

export const extractDataUrlSourceMap = (dataUrl: string): string => {
  const hash = createHash('sha1').update(dataUrl).digest('hex')
  const outFileName = `${hash}.js.map`
  const outFilePath = join(Root.root, '.vscode-source-maps', outFileName)

  if (!existsSync(outFilePath)) {
    const dir = dirname(outFilePath)
    mkdirSync(dir, { recursive: true })
    const rest = dataUrl.slice(prefix.length)
    const restString = Buffer.from(rest, 'base64').toString()
    const data = JSON.parse(restString)
    writeFileSync(outFilePath, JSON.stringify(data))
  }

  const fileUrl = pathToFileURL(outFilePath).toString()
  return fileUrl
}
