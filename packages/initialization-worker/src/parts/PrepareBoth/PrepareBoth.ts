import { connectDevtools } from '../ConnectDevtools/ConnectDevtools.ts'
import { connectElectron } from '../ConnectElectron/ConnectElectron.ts'
import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import * as DebuggerCreateRpcConnection from '../DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.ts'
import { DevtoolsProtocolDebugger, DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as Disposables from '../Disposables/Disposables.ts'
import * as LaunchIde from '../LaunchIde/LaunchIde.ts'
import * as MonkeyPatchElectronScript from '../MonkeyPatchElectronScript/MonkeyPatchElectronScript.ts'
import * as TimeoutConstants from '../TimeoutConstants/TimeoutConstants.ts'
import * as WaitForDevtoolsListening from '../WaitForDevtoolsListening/WaitForDevtoolsListening.ts'

export const prepareBoth = async (headlessMode, cwd, ide, vscodePath, commit, connectionId, isFirstConnection, canUseIdleCallback) => {
  const { child, webSocketUrl, parsedVersion } = await LaunchIde.launchIde({
    headlessMode,
    cwd,
    ide,
    vscodePath,
    commit,
    addDisposable: Disposables.add,
  })
  const devtoolsWebSocketUrlPromise = WaitForDevtoolsListening.waitForDevtoolsListening(child.stderr)

  const electronIpc = await DebuggerCreateIpcConnection.createConnection(webSocketUrl)
  const electronRpc = DebuggerCreateRpcConnection.createRpc(electronIpc, canUseIdleCallback)

  const { monkeyPatchedElectronId, electronObjectId } = await connectElectron(electronRpc)

  await DevtoolsProtocolDebugger.resume(electronRpc)

  const devtoolsWebSocketUrl = await devtoolsWebSocketUrlPromise

  const connectDevtoolsPromise = connectDevtools(devtoolsWebSocketUrl, TimeoutConstants.AttachToPage)

  await DevtoolsProtocolRuntime.callFunctionOn(electronRpc, {
    functionDeclaration: MonkeyPatchElectronScript.undoMonkeyPatch,
    objectId: monkeyPatchedElectronId,
  })

  await connectDevtoolsPromise

  return {
    webSocketUrl,
    devtoolsWebSocketUrl,
    monkeyPatchedElectronId,
    electronObjectId,
    childPid: child.pid,
    parsedVersion,
  }
}

export const undoMonkeyPatch = async () => {}
