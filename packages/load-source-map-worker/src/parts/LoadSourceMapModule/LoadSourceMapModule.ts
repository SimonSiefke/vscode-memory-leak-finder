import { emptySourceMap } from '../EmptySourceMap/EmptySourceMap.ts'
import * as LoadSourceMapFromDataUrl from '../LoadSourceMapFromDataUrl/LoadSourceMapFromData.ts'
import * as LoadSourceMapFromFile from '../LoadSourceMapFromFile/LoadSourceMapFromFile.ts'
import * as LoadSourceMapFromUrl from '../LoadSourceMapFromUrl/LoadSourceMapFromUrl.ts'
import * as LoadSourceMapFromVscodeFile from '../LoadSourceMapFromVscodeFile/LoadSourceMapFromVscodeFile.ts'

interface LoadSourceMap {
  (url: string, hash: string): Promise<any>
}

const loadEmptySourceMap: LoadSourceMap = async () => {
  return emptySourceMap
}

export const getModule = (protocol: string): LoadSourceMap => {
  switch (protocol) {
    case 'data':
      return LoadSourceMapFromDataUrl.loadSourceMap
    case 'file':
      return LoadSourceMapFromFile.loadSourceMap
    case 'http':
    case 'https':
      return LoadSourceMapFromUrl.loadSourceMap
    case 'noop':
      return loadEmptySourceMap
    case 'vscode-file':
      return LoadSourceMapFromVscodeFile.loadSourceMap
    default:
      throw new Error(`unsupported protocol ${protocol}`)
  }
}
