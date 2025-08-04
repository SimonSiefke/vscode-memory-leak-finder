import { once } from 'node:events'

export const waitForWebSocketToBeOpen = async (webSocket: WebSocket): Promise<void> => {
  await once(webSocket, 'open')
}
