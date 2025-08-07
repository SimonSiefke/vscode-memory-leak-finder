import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.js'
import * as DebuggerCreateRpcConnection from '../DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.js'
import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.js'
import { DevtoolsProtocolDebugger, DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as LaunchIde from '../LaunchIde/LaunchIde.js'
import * as MakeElectronAvailableGlobally from '../MakeElectronAvailableGlobally/MakeElectronAvailableGlobally.js'
import * as MakeRequireAvailableGlobally from '../MakeRequireAvailableGlobally/MakeRequireAvailableGlobally.js'
import * as MonkeyPatchElectronScript from '../MonkeyPatchElectronScript/MonkeyPatchElectronScript.js'
import { VError } from '../VError/VError.js'
import * as WaitForDevtoolsListening from '../WaitForDevtoolsListening/WaitForDevtoolsListening.js'

const waitForDebuggerToBePaused = async (rpc) => {
  try {
    const msg = await rpc.once(DevtoolsEventType.DebuggerPaused)
    return msg
  } catch (error) {
    throw new VError(error, `Failed to wait for debugger`)
  }
}

const connectElectron = async (electronRpc) => {
  console.log('test worker command')

  let debuggerPausedPromise = waitForDebuggerToBePaused(electronRpc)
  await Promise.all([
    DevtoolsProtocolDebugger.enable(electronRpc),
    DevtoolsProtocolRuntime.enable(electronRpc),
    DevtoolsProtocolRuntime.runIfWaitingForDebugger(electronRpc),
  ])
  const msg = await debuggerPausedPromise
  const callFrame = msg.params.callFrames[0]
  const callFrameId = callFrame.callFrameId

  const electron = await DevtoolsProtocolDebugger.evaluateOnCallFrame(electronRpc, {
    callFrameId,
    expression: `require('electron')`,
    generatePreview: true,
    includeCommandLineAPI: true,
  })
  const require = await DevtoolsProtocolDebugger.evaluateOnCallFrame(electronRpc, {
    callFrameId,
    expression: `require`,
    generatePreview: true,
    includeCommandLineAPI: true,
  })
  await DevtoolsProtocolRuntime.runIfWaitingForDebugger(electronRpc)

  const electronObjectId = electron.result.result.objectId
  const requireObjectId = require.result.result.objectId

  // TODO headlessmode

  const monkeyPatchedElectron = await DevtoolsProtocolRuntime.callFunctionOn(electronRpc, {
    functionDeclaration: MonkeyPatchElectronScript.monkeyPatchElectronScript,
    objectId: electronObjectId,
  })

  await Promise.all([
    MakeElectronAvailableGlobally.makeElectronAvailableGlobally(electronRpc, electronObjectId),
    MakeRequireAvailableGlobally.makeRequireAvailableGlobally(electronRpc, requireObjectId),
  ])

  return {
    monkeyPatchedElectronId: monkeyPatchedElectron.objectId,
    electronObjectId,
  }
}

export const prepareBoth = async (headlessMode, cwd, ide, vscodePath, commit, connectionId, isFirstConnection, canUseIdleCallback) => {
  const { child, webSocketUrl } = await LaunchIde.launchIde({
    headlessMode,
    cwd,
    ide,
    vscodePath,
    commit,
  })
  const devtoolsWebSocketUrlPromise = WaitForDevtoolsListening.waitForDevtoolsListening(child.stderr)

  const electronIpc = await DebuggerCreateIpcConnection.createConnection(webSocketUrl)
  const electronRpc = DebuggerCreateRpcConnection.createRpc(electronIpc, canUseIdleCallback)

  const { monkeyPatchedElectronId, electronObjectId } = await connectElectron(electronRpc)

  await DevtoolsProtocolDebugger.resume(electronRpc)

  const devtoolsWebSocketUrl = await devtoolsWebSocketUrlPromise

  await DevtoolsProtocolRuntime.callFunctionOn(electronRpc, {
    functionDeclaration: MonkeyPatchElectronScript.undoMonkeyPatch,
    objectId: monkeyPatchedElectronId,
  })

  // TODO can probably dispose this electron rpc at this point

  // TODO start workers before connecting
  // TODO connect workers in parallel
  // TODO maybe pause again at this point, ensuring workers can connect correctly
  return {
    webSocketUrl,
    devtoolsWebSocketUrl,
    monkeyPatchedElectronId,
    electronObjectId,
  }
}
