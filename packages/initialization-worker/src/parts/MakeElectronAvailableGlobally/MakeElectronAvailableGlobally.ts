import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

const script = `function () {
  const electron = this
  globalThis._____electron = electron
}
`

<<<<<<< HEAD
export const makeElectronAvailableGlobally = async (electronRpc: { invoke(method: string, params?: unknown): Promise<unknown> }, electronObjectId: string): Promise<void> => {
=======
export const makeElectronAvailableGlobally = async (
  electronRpc: { invoke(method: string, params?: unknown): Promise<unknown> },
  electronObjectId: string,
): Promise<void> => {
>>>>>>> origin/main
  await DevtoolsProtocolRuntime.callFunctionOn(electronRpc, {
    functionDeclaration: script,
    objectId: electronObjectId,
  })
}
