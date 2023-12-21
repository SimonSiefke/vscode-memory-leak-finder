export const getModule = (protocol) => {
  switch (protocol) {
    case 'data':
      return import('../LoadSourceMapFromDataUrl/LoadSourceMapFromData.js')
    case 'http':
    case 'https':
      return import('../LoadSourceMapFromUrl/LoadSourceMapFromUrl.js')
    default:
      throw new Error(`unsupported protocol ${protocol}`)
  }
}
