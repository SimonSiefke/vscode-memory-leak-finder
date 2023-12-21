import { once } from 'node:events'
import * as NodeVersion from '../NodeVersion/NodeVersion.js'

const RE_STARTING_INSPECTOR_FAILED = /Starting inspector on .* failed/s
const RE_LISTENING_ON = /Debugger listening on (.*)/
const RE_YARN_NOT_INSTALLED = /spawn yarn ENOENT/

export const waitForDebuggerListening = async (stream) => {
  const [firstData] = await once(stream, 'data')
  if (!firstData.includes('Debugger listening on')) {
    if (RE_STARTING_INSPECTOR_FAILED.test(firstData)) {
      throw new Error(firstData.trim())
    }
    if (RE_YARN_NOT_INSTALLED.test(firstData)) {
      throw new Error(`yarn not installed in this node version (${NodeVersion.nodeVersion})`)
    }
    throw new Error(`Failed to connect to debugger: Unexpected first message: ${firstData}`)
  }
  const match = firstData.match(RE_LISTENING_ON)
  if (!match) {
    throw new Error(`Failed to extract websocket url from stdout`)
  }
  const webSocketUrl = match[1]
  return webSocketUrl
}
