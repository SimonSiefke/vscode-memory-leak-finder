export const create = () => {
  const scriptMap = Object.create(null)
  const handleScriptParsed = (event) => {
    const { url, scriptId, sourceMapURL } = event.params
    if (!url) {
      return
    }
    scriptMap[scriptId] = {
      url,
      sourceMapUrl: sourceMapURL,
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
