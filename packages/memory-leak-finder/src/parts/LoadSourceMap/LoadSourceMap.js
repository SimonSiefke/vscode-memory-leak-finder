import { VError } from '../VError/VError.js'
import * as LoadSourceMapModule from '../LoadSourceMapModule/LoadSourceMapModule.js'

const getProtocol = (url) => {
  const colonIndex = url.indexOf(':')
  if (colonIndex === -1) {
    console.warn(`Unsupported source map url ${url}`)
    return 'noop'
  }
  return url.slice(0, colonIndex)
}

export const loadSourceMap = async (url) => {
  try {
    const protocol = getProtocol(url)
    const module = await LoadSourceMapModule.getModule(protocol)
    const data = await module.loadSourceMap(url)
    return data
  } catch (error) {
    throw new VError(error, `Failed to load source map for ${url}`)
  }
}
