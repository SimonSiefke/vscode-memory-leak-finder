const RE_URL = /http:\/\/localhost:\d+\//g

export const removeServerUrlPrefix = (stackTrace) => {
  return stackTrace.replaceAll(RE_URL, '')
}
