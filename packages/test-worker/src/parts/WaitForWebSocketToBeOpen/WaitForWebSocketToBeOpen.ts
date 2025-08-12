import { once } from 'node:events'

export const waitForWebSocketToBeOpen = async (webSocket) => {
  await once(webSocket, 'open')
}
