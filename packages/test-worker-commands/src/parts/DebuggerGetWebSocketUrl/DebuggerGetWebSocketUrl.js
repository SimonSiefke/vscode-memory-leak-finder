/**
 *
 * @param {any[]} jsonList
 * @returns
 */
export const getWebSocketUrl = (jsonList) => {
  if (!Array.isArray(jsonList) || jsonList.length === 0) {
    throw new Error(`no debug instances found`)
  }
  const first = jsonList[0]
  const { webSocketDebuggerUrl } = first
  return webSocketDebuggerUrl
}
