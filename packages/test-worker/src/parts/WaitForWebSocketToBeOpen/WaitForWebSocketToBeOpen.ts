import { once } from 'node:events'

export const waitForWebSocketToBeOpen = async (webSocket: any) => {
  await once(webSocket, 'open')
}
