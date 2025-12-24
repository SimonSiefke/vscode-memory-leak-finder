import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import type { Session } from '../Session/Session.ts'

export const getGlobalLexicalScopeNames = async (session: Session) => {
  const scopeNamesResult = await DevtoolsProtocolRuntime.globalLexicalScopeNames(session, {})
  return scopeNamesResult.names
}
