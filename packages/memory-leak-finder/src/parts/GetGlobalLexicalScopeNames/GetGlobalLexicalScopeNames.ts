import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

export const getGlobalLexicalScopeNames = async (session: Session) => {
  const scopeNamesResult = await DevtoolsProtocolRuntime.globalLexicalScopeNames(session, {})
  return scopeNamesResult.names
}
