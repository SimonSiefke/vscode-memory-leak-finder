import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'

export const getGlobalLexicalScopeNames = async (session) => {
  const scopeNames = await DevtoolsProtocolRuntime.globalLexicalScopeNames(session, {})
  return scopeNames
}
