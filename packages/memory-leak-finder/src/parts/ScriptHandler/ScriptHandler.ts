import type { IScriptHandler } from '../IScriptHandler/IScriptHandler.ts'
import * as ExtractDataUrlSourceMap from '../ExtractDataUrlSourceMap/ExtractDataUrlSourceMap.ts'
import * as FindMatchingSourceMap from '../FindMatchingSourceMap/FindMatchingSourceMap.ts'

export const create = (): IScriptHandler => {
  const scriptMap = Object.create(null)
  const handleScriptParsed = (event) => {
    const { scriptId, sourceMapURL, url } = event.params
    if (!url) {
      return
    }
    let sourceMapUrl = sourceMapURL
    if (ExtractDataUrlSourceMap.isDataUrl(sourceMapURL)) {
      try {
        sourceMapUrl = ExtractDataUrlSourceMap.extractDataUrlSourceMap(sourceMapURL)
      } catch (error) {
        // ignore
        console.error('Failed to extract data URL sourcemap:', error)
      }
    }
    // If no source map URL was found, try to find a matching .js.map file
    if (!sourceMapUrl) {
      const matchingSourceMap = FindMatchingSourceMap.findMatchingSourceMap(url)
      if (matchingSourceMap) {
        sourceMapUrl = matchingSourceMap
      }
    }
    scriptMap[scriptId] = {
      sourceMapUrl,
      url,
    }
  }
  return {
    scriptMap,
    async start(session) {
      session.on('Debugger.scriptParsed', handleScriptParsed)
      await session.invoke('Debugger.enable')
    },
    async stop(session) {
      session.off('Debugger.scriptParsed', handleScriptParsed)
      await session.invoke('Debugger.disable')
    },
  }
}
