import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

const script = `function () {
  const require = this
  globalThis._____require = require
}
`

export const makeRequireAvailableGlobally = async (electronRpc: { invoke(method: string, params?: unknown): Promise<unknown> }, requireObjectId: string): Promise<void> => {
  await DevtoolsProtocolRuntime.callFunctionOn(electronRpc, {
    functionDeclaration: script,
    objectId: requireObjectId,
  })
}
