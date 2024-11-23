import * as GetElectronErrorMessage from '../GetElectronErrorMessage/GetElectronErrorMessage.js'
import * as IsImportantErrorMessage from '../IsImportantErrorMessage/IsImportantErrorMessage.js'
import * as WaitForData from '../WaitForData/WaitForData.js'

const RE_LISTENING_ON = /DevTools listening on (ws:\/\/.*)/

const errorChecker = async (data, stream) => {
  if (IsImportantErrorMessage.isImportantErrorMessage(data)) {
    const error = await GetElectronErrorMessage.getElectronErrorMessage(data, stream)
    throw error
  }
}

const waitForRelevantData = async (stream) => {
  const data = await WaitForData.waitForData(stream, 'DevTools listening on', errorChecker)
  if (!data) {
    throw new Error(`Failed to extract websocket url from stderr`)
  }
  return data
}

export const waitForDevtoolsListening = async (stream) => {
  const relevantData = await waitForRelevantData(stream)
  // @ts-ignore
  const match = relevantData.match(RE_LISTENING_ON)
  if (!match) {
    throw new Error(`Failed to extract websocket url from stderr`)
  }
  const webSocketUrl = match[1]
  return webSocketUrl
}
