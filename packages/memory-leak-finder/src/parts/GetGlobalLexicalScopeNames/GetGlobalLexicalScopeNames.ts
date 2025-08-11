import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

export const getGlobalLexicalScopeNames = async (session) => {
  const scopeNamesResult = await DevtoolsProtocolRuntime.globalLexicalScopeNames(session, {})
  return scopeNamesResult.names
}
