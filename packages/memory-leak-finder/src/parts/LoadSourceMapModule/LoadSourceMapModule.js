export const getModule = (protocol) => {
  switch (protocol) {
    case 'data':
      return import('../LoadSourceMapFromDataUrl/LoadSourceMapFromData.js')
    case 'http':
    case 'https':
      return import('../LoadSourceMapFromUrl/LoadSourceMapFromUrl.js')
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
