import { once } from 'node:events'

const RE_STARTING_INSPECTOR_FAILED = /Starting inspector on .* failed/s
const RE_LISTENING_ON = /Debugger listening on (.*)/

export const waitForDebuggerListening = async (stream) => {
  const [firstData] = await once(stream, 'data')
  if (!firstData.includes('Debugger listening on')) {
    if (RE_STARTING_INSPECTOR_FAILED.test(firstData)) {
      throw new Error(firstData.trim())
    }
    throw new Error(`Failed to connect to debugger: unexpected first message: ${firstData}`)
  }
  const match = firstData.match(RE_LISTENING_ON)
  if (!match) {
    throw new Error(`Failed to extract websocket url from stdout`)
  }
  const webSocketUrl = match[1]
  return webSocketUrl
}
