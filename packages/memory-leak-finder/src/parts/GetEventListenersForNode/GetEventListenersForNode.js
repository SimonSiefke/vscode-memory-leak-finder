import { DevtoolsProtocolDomDebugger } from '@vscode-memory-leak-finder/devtools-protocol'

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
