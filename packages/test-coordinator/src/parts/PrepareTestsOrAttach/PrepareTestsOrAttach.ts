import { connectWorkers } from '../ConnectWorkers/ConnectWorkers.ts'
import * as PrepareTests from '../PrepareTests/PrepareTests.ts'

interface State {
  promise: Promise<any> | undefined
}

export const state: State = {
  promise: undefined,
}

export const prepareTestsAndAttach = async (
  cwd: string,
  headlessMode: boolean,
  recordVideo: boolean,
  connectionId: number,
  timeouts: any,
  runMode: number,
  ide: string,
  ideVersion: string,
  vscodePath: string,
  commit: string,
  attachedToPageTimeout: number,
  measureId: string,
  idleTimeout: number,
  pageObjectPath: string,
  measureNode: boolean,
) => {
  const isFirst = state.promise === undefined
  if (isFirst) {
    state.promise = PrepareTests.prepareTests(
      cwd,
      headlessMode,
      recordVideo,
      connectionId,
      timeouts,
      ide,
      ideVersion,
      vscodePath,
      commit,
      attachedToPageTimeout,
      measureId,
      idleTimeout,
      pageObjectPath,
      runMode,
    )
  }
  const result = await state.promise

  const { webSocketUrl, devtoolsWebSocketUrl, electronObjectId, parsedVersion, utilityContext } = await result

  const { memoryRpc, testWorkerRpc, videoRpc } = await connectWorkers(
    recordVideo,
    connectionId,
    devtoolsWebSocketUrl,
    webSocketUrl,
    electronObjectId,
    attachedToPageTimeout,
    measureId,
    idleTimeout,
    pageObjectPath,
    parsedVersion,
    timeouts,
    utilityContext,
    runMode,
    measureNode,
  )
  return {
    memoryRpc,
    testWorkerRpc,
    videoRpc,
  }
}
