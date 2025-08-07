import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'

const script = `function () {
  const electron = this
  globalThis._____electron = electron
}
`

export const makeElectronAvailableGlobally = async (electronRpc, electronObjectId) => {
  await DevtoolsProtocolRuntime.callFunctionOn(electronRpc, {
    functionDeclaration: script,
    objectId: electronObjectId,
  })
}
