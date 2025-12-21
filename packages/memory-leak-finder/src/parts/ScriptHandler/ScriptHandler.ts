import type { IScriptHandler } from '../IScriptHandler/IScriptHandler.ts'
import * as ExtractDataUrlSourceMap from '../ExtractDataUrlSourceMap/ExtractDataUrlSourceMap.ts'

export const create = (): IScriptHandler => {
  const scriptMap = Object.create(null)
  const handleScriptParsed = (event) => {
    const { url, scriptId, sourceMapURL } = event.params
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
    scriptMap[scriptId] = {
      url,
      sourceMapUrl,
    }
  }
  return {
    async start(session) {
      session.on('Debugger.scriptParsed', handleScriptParsed)
      await session.invoke('Debugger.enable')
    },
    async stop(session) {
      session.off('Debugger.scriptParsed', handleScriptParsed)
      await session.invoke('Debugger.disable')
    },
    scriptMap,
  }
}
