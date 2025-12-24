import { DevtoolsProtocolDomDebugger } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import type { Session } from '../Session/Session.ts'

export const getEventListenersOfTargets = async (session: Session, targets) => {
  const promises: Promise<any>[] = []
  for (const target of targets) {
    const promise = DevtoolsProtocolDomDebugger.getEventListeners(session, {
      objectId: target.objectId,
    })
    promises.push(promise)
  }
  const results = await Promise.all(promises)
  return results
}
