import * as ConnectDevtools from '../ConnectDevtools/ConnectDevtools.ts'
import * as MemoryLeakWorker from '../MemoryLeakWorker/MemoryLeakWorker.ts'
import * as VideoRecording from '../VideoRecording/VideoRecording.ts'

export const connectWorkers = async (
  rpc: any,
  headlessMode: boolean,
  recordVideo: boolean,
  connectionId: number,
  devtoolsWebSocketUrl: string,
  webSocketUrl: string,
  isFirstConnection: boolean,
  canUseIdleCallback: boolean,
  electronObjectId: string,
  attachedToPageTimeout: number,
  measureId: string,
  idleTimeout: number,
  pageObjectPath: string,
  isHeadless: boolean,
  parsedIdeVersion: any,
  timeouts: boolean,
  utilityContext: any,
  sessionId: string,
  targetId: string,
) => {
  const promises: Promise<void>[] = []
  if (recordVideo) {
    promises.push(VideoRecording.start(devtoolsWebSocketUrl, attachedToPageTimeout, idleTimeout))
  }
  promises.push(MemoryLeakWorker.startWorker(devtoolsWebSocketUrl, connectionId, measureId, attachedToPageTimeout))
  promises.push(
    ConnectDevtools.connectDevtools(
      rpc,
      connectionId,
      devtoolsWebSocketUrl,
      electronObjectId,
      isFirstConnection,
      headlessMode,
      webSocketUrl,
      canUseIdleCallback,
      idleTimeout,
      pageObjectPath,
      isHeadless,
      parsedIdeVersion,
      timeouts,
      utilityContext,
      sessionId,
      targetId,
    ),
  )
  await Promise.all(promises)
}
