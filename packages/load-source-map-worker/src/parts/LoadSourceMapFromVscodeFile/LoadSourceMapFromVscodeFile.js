import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

export const loadSourceMap = async (url) => {
  if (!url.startsWith('vscode-file://vscode-app')) {
    throw new Error('unsupported source map url')
  }
  const fileUrl = `file://` + url.slice('vscode-file://vscode-app'.length)
  const path = fileURLToPath(fileUrl)
  const content = await readFile(path, 'utf8')
  const data = JSON.parse(content)
  return data
}
