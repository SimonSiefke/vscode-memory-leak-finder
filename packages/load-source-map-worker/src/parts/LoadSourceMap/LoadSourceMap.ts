import { VError } from '../VError/VError.ts'
import * as LoadSourceMapModule from '../LoadSourceMapModule/LoadSourceMapModule.ts'

const getProtocol = (url: string): string => {
  const colonIndex = url.indexOf(':')
  if (colonIndex === -1) {
    console.warn(`Unsupported source map url ${url}`)
    return 'noop'
  }
  return url.slice(0, colonIndex)
}

export const loadSourceMap = async (url: string, hash: string): Promise<any> => {
  try {
    const protocol = getProtocol(url)
    const module = await LoadSourceMapModule.getModule(protocol)
    const data = await module.loadSourceMap(url, hash)
    return data
  } catch (error) {
    throw new VError(error, `Failed to load source map for ${url}`)
  }
}
