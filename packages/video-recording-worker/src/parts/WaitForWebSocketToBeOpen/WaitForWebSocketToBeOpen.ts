import { once } from 'node:events'

export const waitForWebSocketToBeOpen = async (webSocket: any): Promise<void> => {
  await once(webSocket, 'open')
}
