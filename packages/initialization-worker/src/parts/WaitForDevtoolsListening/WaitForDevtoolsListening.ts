import * as GetElectronErrorMessage from '../GetElectronErrorMessage/GetElectronErrorMessage.ts'
import * as IsImportantErrorMessage from '../IsImportantErrorMessage/IsImportantErrorMessage.ts'
import * as WaitForData from '../WaitForData/WaitForData.ts'

const RE_LISTENING_ON = /DevTools listening on (ws:\/\/.*)/

interface ReadableStreamLike {
  emit(event: 'data', data: string): boolean
  on(event: 'data', listener: (data: string | Buffer) => void): unknown
  on(event: 'end' | 'close', listener: () => void): unknown
  on(event: 'error', listener: (error: unknown) => void): unknown
  off?(event: 'data', listener: (data: string | Buffer) => void): unknown
  off?(event: 'end' | 'close', listener: () => void): unknown
  off?(event: 'error', listener: (error: unknown) => void): unknown
  removeListener?(event: 'data', listener: (data: string | Buffer) => void): unknown
  removeListener?(event: 'end' | 'close', listener: () => void): unknown
  removeListener?(event: 'error', listener: (error: unknown) => void): unknown
}

const errorChecker = async (data: string, stream: ReadableStreamLike): Promise<void> => {
  if (IsImportantErrorMessage.isImportantErrorMessage(data)) {
    const error = await GetElectronErrorMessage.getElectronErrorMessage(data, stream)
    throw error
  }
}

const waitForRelevantData = async (stream: ReadableStreamLike): Promise<string> => {
  const data = await WaitForData.waitForData(stream, 'DevTools listening on', errorChecker)
  if (!data) {
    throw new Error(`Failed to extract websocket url from stderr`)
  }
  return data
}

export const waitForDevtoolsListening = async (stream: ReadableStreamLike): Promise<string> => {
  const relevantData = await waitForRelevantData(stream)
  // @ts-ignore
  const match = relevantData.match(RE_LISTENING_ON)
  if (!match) {
    throw new Error(`Failed to extract websocket url from stderr`)
  }
  const webSocketUrl = match[1]
  return webSocketUrl
}
