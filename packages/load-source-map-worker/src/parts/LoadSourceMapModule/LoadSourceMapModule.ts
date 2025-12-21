import { emptySourceMap } from '../EmptySourceMap/EmptySourceMap.ts'

export const getModule = (protocol: string): Promise<any> | any => {
  switch (protocol) {
    case 'data':
      return import('../LoadSourceMapFromDataUrl/LoadSourceMapFromData.ts')
    case 'file':
      return import('../LoadSourceMapFromFile/LoadSourceMapFromFile.ts')
    case 'http':
    case 'https':
      return import('../LoadSourceMapFromUrl/LoadSourceMapFromUrl.ts')
    case 'noop':
      return {
        loadSourceMap() {
          return emptySourceMap
        },
      }
    case 'vscode-file':
      return import('../LoadSourceMapFromVscodeFile/LoadSourceMapFromVscodeFile.ts')
    default:
      throw new Error(`unsupported protocol ${protocol}`)
  }
}
