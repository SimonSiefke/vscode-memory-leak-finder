import { DevtoolsProtocolDomDebugger } from '../DevtoolsProtocol/DevtoolsProtocol.js'

/**
 *
 * @param {any} session
 * @param {{objectId:string}} node
 */
export const getEventListenersForNode = async (session, node) => {
  const { listeners } = await DevtoolsProtocolDomDebugger.getEventListeners(session, {
    objectId: node.objectId,
  })
  return listeners
}
