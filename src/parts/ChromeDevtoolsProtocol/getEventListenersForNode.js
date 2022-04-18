/**
 *
 * @param {import('@playwright/test').CDPSession} session
 * @param {{objectId:string}} node
 */
export const getEventListenersForNode = async (session, node) => {
  const { listeners } = await session.send("DOMDebugger.getEventListeners", {
    objectId: node.objectId,
  });
  return listeners;
};
