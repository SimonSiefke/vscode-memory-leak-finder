import { DevtoolsProtocolDomDebugger } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

export const getEventListenersOfTargets = async (session, targets) => {
  const promises = []
  for (const target of targets) {
    const promise = DevtoolsProtocolDomDebugger.getEventListeners(session, {
      objectId: target.objectId,
    })
    promises.push(promise)
  }
  const results = await Promise.all(promises)
  return results
}
