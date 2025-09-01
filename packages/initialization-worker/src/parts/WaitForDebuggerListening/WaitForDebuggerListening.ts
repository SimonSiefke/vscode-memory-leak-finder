import * as NodeVersion from '../NodeVersion/NodeVersion.ts'
import * as WaitForData from '../WaitForData/WaitForData.ts'

const RE_STARTING_INSPECTOR_FAILED = /Starting inspector on .* failed/s
const RE_LISTENING_ON = /Debugger listening on (.*)/
const RE_YARN_NOT_INSTALLED = /spawn yarn ENOENT/

const isIgnoredError = (data: string): boolean => {
  if (data.includes('This will stop working in the next major version of npm.')) {
    return true
  }
  if (data.includes('DeprecationWarning: fs.Stats constructor is deprecated.')) {
    return true
  }
  return false
}

const errorChecker = (data: string) => {
  if (isIgnoredError(data)) {
    return
  }
  if (RE_STARTING_INSPECTOR_FAILED.test(data)) {
    throw new Error(data.trim())
  }
  if (RE_YARN_NOT_INSTALLED.test(data)) {
    throw new Error(`yarn not installed in this node version (${NodeVersion.nodeVersion})`)
  }
  throw new Error(`Failed to connect to debugger: Unexpected first message: ${data}`)
}

export const waitForDebuggerListening = async (stream) => {
  const firstData = await WaitForData.waitForData(stream, 'Debugger listening on', errorChecker)
  // @ts-ignore
  const match = firstData.match(RE_LISTENING_ON)
  if (!match) {
    throw new Error(`Failed to extract websocket url from stdout`)
  }
  const webSocketUrl = match[1]
  return webSocketUrl
}
