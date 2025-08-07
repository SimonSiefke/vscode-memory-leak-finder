import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'

const script = `function () {
  const require = this
  globalThis._____require = require
}
`

export const makeRequireAvailableGlobally = async (electronRpc, requireObjectId) => {
  await DevtoolsProtocolRuntime.callFunctionOn(electronRpc, {
    functionDeclaration: script,
    objectId: requireObjectId,
  })
}
