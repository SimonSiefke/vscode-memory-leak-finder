import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

const script = `function () {
  const electron = this
  globalThis._____electron = electron
}
`

export const makeElectronAvailableGlobally = async (electronRpc: { invoke(method: string, params?: unknown): Promise<unknown> }, electronObjectId: string): Promise<void> => {
  await DevtoolsProtocolRuntime.callFunctionOn(electronRpc, {
    functionDeclaration: script,
    objectId: electronObjectId,
  })
}
