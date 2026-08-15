import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

export const getGlobalPropertyNames = (session: Session): Promise<readonly string[]> => {
  return DevtoolsProtocolRuntime.evaluate(session, {
    expression: 'Object.getOwnPropertyNames(globalThis).sort()',
    returnByValue: true,
  })
}
