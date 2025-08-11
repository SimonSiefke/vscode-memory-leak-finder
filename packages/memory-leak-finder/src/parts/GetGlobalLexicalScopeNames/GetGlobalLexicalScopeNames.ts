import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'

export const getGlobalLexicalScopeNames = async (session) => {
  const scopeNamesResult = await DevtoolsProtocolRuntime.globalLexicalScopeNames(session, {})
  return scopeNamesResult.names
}
