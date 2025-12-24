import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

const script = `function () {
  const require = this
  globalThis._____require = require
}
`

<<<<<<< HEAD
export const makeRequireAvailableGlobally = async (electronRpc: { invoke(method: string, params?: unknown): Promise<unknown> }, requireObjectId: string): Promise<void> => {
=======
export const makeRequireAvailableGlobally = async (
  electronRpc: { invoke(method: string, params?: unknown): Promise<unknown> },
  requireObjectId: string,
): Promise<void> => {
>>>>>>> origin/main
  await DevtoolsProtocolRuntime.callFunctionOn(electronRpc, {
    functionDeclaration: script,
    objectId: requireObjectId,
  })
}
