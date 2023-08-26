import { once } from 'node:events'
import * as GetElectronErrorMessage from '../GetElectronErrorMessage/GetElectronErrorMessage.js'
import * as IsImportantErrorMessage from '../IsImportantErrorMessage/IsImportantErrorMessage.js'

const RE_LISTENING_ON = /DevTools listening on (ws:\/\/.*)/

const waitForRelevantData = async (stream) => {
  for (let i = 0; i < 10; i++) {
    const [data] = await once(stream, 'data')
    if (data.includes('DevTools listening on')) {
      return data
    }
    if (IsImportantErrorMessage.isImportantErrorMessage(data)) {
      const error = await GetElectronErrorMessage.getElectronErrorMessage(data, stream)
      throw error
    }
  }
  throw new Error(`Failed to extract websocket url from stderr`)
}

export const waitForDevtoolsListening = async (stream) => {
  const relevantData = await waitForRelevantData(stream)
  const match = relevantData.match(RE_LISTENING_ON)
  if (!match) {
    throw new Error(`Failed to extract websocket url from stderr`)
  }
  const webSocketUrl = match[1]
  return webSocketUrl
}
