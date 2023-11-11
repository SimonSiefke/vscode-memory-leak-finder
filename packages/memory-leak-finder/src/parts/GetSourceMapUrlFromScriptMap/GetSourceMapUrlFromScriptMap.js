const RE_LOCAL_HOST = /^http:\/\/localhost:\d+/

const cleanUrl = (url) => {
  return url.replace(RE_LOCAL_HOST, '')
}

export const getSourceMapUrlFromScriptMap = (scriptId, scriptMap) => {
  if (scriptId in scriptMap) {
    const entry = scriptMap[scriptId]
    const { url, sourceMapUrl } = entry
    return {
      url: cleanUrl(url),
      sourceMapUrl,
    }
  }
  return {
    url: '',
    sourceMapUrl: '',
  }
}
