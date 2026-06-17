import * as LaunchTestWorker from '../LaunchTestWorker/LaunchTestWorker.ts'
import * as MemoryLeakWorker from '../MemoryLeakWorker/MemoryLeakWorker.ts'
import * as VideoRecording from '../VideoRecording/VideoRecording.ts'

export const connectWorkers = async (
  platform: string,
  arch: string,
  recordVideo: boolean,
  compressVideo: boolean,
  screencastQuality: number,
  connectionId: number,
  devtoolsWebSocketUrl: string,
  webSocketUrl: string,
  electronObjectId: string,
  attachedToPageTimeout: number,
  measureId: string,
  idleTimeout: number,
  pageObjectPath: string,
  parsedIdeVersion: any,
  pid: number,
  timeouts: boolean,
  utilityContext: any,
  runMode: number,
  measureNode: boolean,
  inspectSharedProcess: boolean,
  inspectExtensions: boolean,
  inspectPtyHost: boolean,
  enableExtensions: boolean,
  inspectPtyHostPort: number,
  inspectSharedProcessPort: number,
  inspectExtensionsPort: number,
  trackFunctions: boolean,
) => {
  const promises: Promise<any>[] = []
  if (recordVideo) {
    promises.push(
      VideoRecording.start(platform, arch, devtoolsWebSocketUrl, attachedToPageTimeout, idleTimeout, screencastQuality, compressVideo),
    )
  } else {
    promises.push(Promise.resolve(undefined))
  }
  promises.push(
    LaunchTestWorker.launchTestWorker(
      platform,
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
      enableExtensions,
      inspectPtyHostPort,
      inspectSharedProcessPort,
      inspectExtensionsPort,
      trackFunctions,
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
    inspectPtyHostPort,
    inspectSharedProcessPort,
    inspectExtensionsPort,
    pid,
  )

  return {
    memoryRpc,
    testWorkerRpc,
    videoRpc,
  }
}
