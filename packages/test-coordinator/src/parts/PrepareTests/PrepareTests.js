import * as CanUseIdleCallback from '../CanUseIdleCallback/CanUseIdleCallback.js'
import * as ConnectDevtools from '../ConnectDevtools/ConnectDevtools.js'
import * as ConnectElectron from '../ConnectElectron/ConnectElectron.js'
import * as KillExistingIdeInstances from '../KillExistingIdeInstances/KillExistingIdeInstances.js'
import * as LaunchIde from '../LaunchIde/LaunchIde.js'
import * as MemoryLeakWorker from '../MemoryLeakWorker/MemoryLeakWorker.js'
import * as PageObject from '../PageObject/PageObject.js'
import * as VideoRecording from '../VideoRecording/VideoRecording.js'
import * as WaitForDevtoolsListening from '../WaitForDevtoolsListening/WaitForDevtoolsListening.js'
import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.js'
import * as DebuggerCreateRpcConnection from '../DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.js'

const prepareBoth = async (headlessMode, cwd, ide, vscodePath, commit, connectionId, isFirstConnection, canUseIdleCallback) => {
  const { child, webSocketUrl } = await LaunchIde.launchIde({
    headlessMode,
    cwd,
    ide,
    vscodePath,
    commit,
  })
  console.log({ webSocketUrl })
  const devtoolsWebSocketUrlPromise = WaitForDevtoolsListening.waitForDevtoolsListening(child.stderr)

  const electronIpc = await DebuggerCreateIpcConnection.createConnection(webSocketUrl)
  const electronRpc = DebuggerCreateRpcConnection.createRpc(electronIpc, canUseIdleCallback)
  console.log({ electronRpc })

  // TODO do it here
  // const { monkeyPatchedElectron, electronObjectId, callFrameId } = await ConnectElectron.connectElectron(
  //   rpc,
  //   connectionId,
  //   headlessMode,
  //   webSocketUrl,
  //   isFirstConnection,
  //   canUseIdleCallback,
  // )
  const devtoolsWebSocketUrl = await devtoolsWebSocketUrlPromise
  return {
    webSocketUrl,
    devtoolsWebSocketUrl,
  }
}

export const prepareTests = async (rpc, cwd, headlessMode, recordVideo, connectionId, timeouts, ide, ideVersion, vscodePath, commit) => {
  // TODO move whole ide launch into separate worker
  const isFirstConnection = true
  const canUseIdleCallback = CanUseIdleCallback.canUseIdleCallback(headlessMode)
  await KillExistingIdeInstances.killExisingIdeInstances(ide)
  const { webSocketUrl, devtoolsWebSocketUrl } = await prepareBoth(
    headlessMode,
    cwd,
    ide,
    vscodePath,
    commit,
    connectionId,
    isFirstConnection,
    canUseIdleCallback,
  )
  if (Math) {
    return
  }
  // const devtoolsWebSocketUrlPromise = WaitForDevtoolsListening.waitForDevtoolsListening(child.stderr)
  // const { monkeyPatchedElectron, electronObjectId, callFrameId } = await ConnectElectron.connectElectron(
  //   rpc,
  //   connectionId,
  //   headlessMode,
  //   webSocketUrl,
  //   isFirstConnection,
  //   canUseIdleCallback,
  // )
  // const devtoolsWebSocketUrl = await devtoolsWebSocketUrlPromise
  console.log({ devtoolsWebSocketUrl })
  if (recordVideo) {
    await VideoRecording.start(devtoolsWebSocketUrl)
  }
  await MemoryLeakWorker.startWorker(devtoolsWebSocketUrl)
  await ConnectDevtools.connectDevtools(
    rpc,
    connectionId,
    devtoolsWebSocketUrl,
    monkeyPatchedElectron,
    electronObjectId,
    callFrameId,
    isFirstConnection,
  )
  await PageObject.create(rpc, connectionId, isFirstConnection, headlessMode, timeouts, ideVersion)
  return {
    rpc,
    webSocketUrl,
    devtoolsWebSocketUrl,
    electronObjectId,
    callFrameId,
    monkeyPatchedElectron,
  }
}
