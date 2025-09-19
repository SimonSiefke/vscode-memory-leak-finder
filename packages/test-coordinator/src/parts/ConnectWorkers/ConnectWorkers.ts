import * as LaunchTestWorker from '../LaunchTestWorker/LaunchTestWorker.ts'
import * as MemoryLeakWorker from '../MemoryLeakWorker/MemoryLeakWorker.ts'
import * as VideoRecording from '../VideoRecording/VideoRecording.ts'

export const connectWorkers = async (
  recordVideo: boolean,
  connectionId: number,
  devtoolsWebSocketUrl: string,
  webSocketUrl: string,
  electronObjectId: string,
  attachedToPageTimeout: number,
  measureId: string,
  idleTimeout: number,
  pageObjectPath: string,
  parsedIdeVersion: any,
  timeouts: boolean,
  utilityContext: any,
  runMode: number,
) => {
  const promises: Promise<any>[] = []
  if (recordVideo) {
    promises.push(VideoRecording.start(devtoolsWebSocketUrl, attachedToPageTimeout, idleTimeout))
  } else {
    promises.push(Promise.resolve(undefined))
  }
  promises.push(MemoryLeakWorker.startWorker(devtoolsWebSocketUrl, connectionId, measureId, attachedToPageTimeout))
  promises.push(
    LaunchTestWorker.launchTestWorker(
      runMode,
      connectionId,
      devtoolsWebSocketUrl,
      electronObjectId,
      webSocketUrl,
      idleTimeout,
      pageObjectPath,
      parsedIdeVersion,
      timeouts,
      utilityContext,
    ),
  )
  const [videoRpc, memoryRpc, testWorkerRpc] = await Promise.all(promises)
  return {
    videoRpc,
    memoryRpc,
    testWorkerRpc,
  }
}
