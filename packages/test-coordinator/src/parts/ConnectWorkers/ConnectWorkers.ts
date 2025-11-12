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
  measureNode: boolean,
  inspectSharedProcess: boolean,
  inspectExtensions: boolean,
  inspectPtyHost: boolean,
) => {
  const promises: Promise<any>[] = []
  if (recordVideo) {
    promises.push(VideoRecording.start(devtoolsWebSocketUrl, attachedToPageTimeout, idleTimeout))
  } else {
    promises.push(Promise.resolve(undefined))
  }
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
      attachedToPageTimeout,
      inspectSharedProcess,
      inspectExtensions,
      inspectPtyHost,
    ),
  )
  const [videoRpc, testWorkerRpc] = await Promise.all(promises)

  const memoryRpc = await MemoryLeakWorker.startWorker(
    devtoolsWebSocketUrl,
    webSocketUrl,
    connectionId,
    measureId,
    attachedToPageTimeout,
    measureNode,
    inspectSharedProcess,
    inspectExtensions,
    inspectPtyHost,
  )

  return {
    videoRpc,
    memoryRpc,
    testWorkerRpc,
  }
}
