import { VError } from '../VError/VError.js'

const getModule = (protocol) => {
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

const getProtocol = (url) => {
  const colonIndex = url.indexOf(':')
  if (colonIndex === -1) {
    throw new Error(`unsupported url ${url}`)
  }
  return url.slice(0, colonIndex)
}

export const loadSourceMap = async (url) => {
  try {
    const protocol = getProtocol(url)
    const module = await getModule(protocol)
    const data = await module.loadSourceMap(url)
    return data
  } catch (error) {
    throw new VError(error, `Failed to load source map for ${url}`)
  }
}
