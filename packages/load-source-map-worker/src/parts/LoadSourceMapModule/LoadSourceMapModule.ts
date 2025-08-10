export const getModule = (protocol: string): Promise<any> | any => {
  switch (protocol) {
    case 'data':
      return import('../LoadSourceMapFromDataUrl/LoadSourceMapFromData.ts')
    case 'http':
    case 'https':
      return import('../LoadSourceMapFromUrl/LoadSourceMapFromUrl.ts')
    case 'file':
      return import('../LoadSourceMapFromFile/LoadSourceMapFromFile.ts')
    case 'vscode-file':
      return import('../LoadSourceMapFromVscodeFile/LoadSourceMapFromVscodeFile.ts')
    case 'noop':
      return {
        loadSourceMap() {
          return {
            version: '3',
            sources: [],
            mappings: [],
          }
        },
      }
    default:
      throw new Error(`unsupported protocol ${protocol}`)
  }
}
