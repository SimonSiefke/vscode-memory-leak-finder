import { once } from 'node:events'

export const waitForWebSocketToBeOpen = async (webSocket: WebSocket) => {
  await once(webSocket, 'open')
}
