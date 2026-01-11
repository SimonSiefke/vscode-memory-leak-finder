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
  const protocol = getProtocol(url)
  const fn = LoadSourceMapModule.getModule(protocol)
  const data = await fn(url, hash)
  return data
}
