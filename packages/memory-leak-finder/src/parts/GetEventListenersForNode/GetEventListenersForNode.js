/**
 *
 * @param {any} session
 * @param {{objectId:string}} node
 */
export const getEventListenersForNode = async (session, node) => {
  const { listeners } = await session.invoke('DOMDebugger.getEventListeners', {
    objectId: node.objectId,
  })
  return listeners
}
