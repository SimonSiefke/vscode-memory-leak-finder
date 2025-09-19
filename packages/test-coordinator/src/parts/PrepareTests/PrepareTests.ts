import * as CanUseIdleCallback from '../CanUseIdleCallback/CanUseIdleCallback.ts'
import { connectWorkers } from '../ConnectWorkers/ConnectWorkers.ts'
import * as KillExistingIdeInstances from '../KillExistingIdeInstances/KillExistingIdeInstances.ts'
import * as PageObject from '../PageObject/PageObject.ts'
import { prepareBoth } from '../PrepareBoth/PrepareBoth.ts'

export const prepareTests = async (
  rpc: any,
  cwd: string,
  headlessMode: boolean,
  recordVideo: boolean,
  connectionId: number,
  timeouts: any,
  ide: string,
  ideVersion: string,
  vscodePath: string,
  commit: string,
  attachedToPageTimeout: number,
  idleTimeout: number,
  pageObjectPath: string,
) => {
  const isFirstConnection = true
  const canUseIdleCallback = CanUseIdleCallback.canUseIdleCallback(headlessMode)
  await KillExistingIdeInstances.killExisingIdeInstances(ide)
  const { webSocketUrl, devtoolsWebSocketUrl, electronObjectId, parsedVersion } = await prepareBoth(
    headlessMode,
    cwd,
    ide,
    vscodePath,
    commit,
    connectionId,
    isFirstConnection,
    canUseIdleCallback,
    attachedToPageTimeout,
  )
  await connectWorkers(
    rpc,
    headlessMode,
    recordVideo,
    connectionId,
    devtoolsWebSocketUrl,
    webSocketUrl,
    isFirstConnection,
    canUseIdleCallback,
    electronObjectId,
    attachedToPageTimeout,
    idleTimeout,
  )
  await PageObject.create(rpc, connectionId, isFirstConnection, headlessMode, timeouts, parsedVersion, pageObjectPath)

  return {
    rpc,
    webSocketUrl,
    devtoolsWebSocketUrl,
    electronObjectId,
    parsedVersion,
  }
}
