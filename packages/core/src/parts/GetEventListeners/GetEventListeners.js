/**
 *
 * @param {import('@playwright/test').CDPSession} session
 * @returns {Promise<number>}
 */
export const getEventListeners = async (session) => {
  // TODO this does not include hidden dom nodes
  const fnResult = await session.send("Runtime.evaluate", {
    expression: `;(() => {
  const nodes = Array.from(document.querySelectorAll('*'))
  const listenerMap = Object.create(null)
  for (const node of nodes) {
    const listeners = getEventListeners(node)
    for (const [key, value] of Object.entries(listeners)) {
      listenerMap[key] ||= 0
      listenerMap[key] += value.length
      listenerMap.z_total ||= 0
      listenerMap.z_total += value.length
    }
  }
  return listenerMap
})()`,
    returnByValue: true,
    includeCommandLineAPI: true,
  });
  const value = fnResult.result.value;
  const total = value.z_total;
  return total;
};
