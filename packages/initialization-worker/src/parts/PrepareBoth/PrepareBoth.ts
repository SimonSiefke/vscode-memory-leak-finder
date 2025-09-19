import { connectDevtools } from '../ConnectDevtools/ConnectDevtools.ts'
import { connectElectron } from '../ConnectElectron/ConnectElectron.ts'
import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import * as DebuggerCreateRpcConnection from '../DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.ts'
import { DevtoolsProtocolDebugger, DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as Disposables from '../Disposables/Disposables.ts'
import * as LaunchIde from '../LaunchIde/LaunchIde.ts'
import * as MonkeyPatchElectronScript from '../MonkeyPatchElectronScript/MonkeyPatchElectronScript.ts'
import * as WaitForDevtoolsListening from '../WaitForDevtoolsListening/WaitForDevtoolsListening.ts'
import { waitForUtilityExecutionContext } from '../WaitForUtilityExecutionContext/WaitForUtilityExecutionContext.ts'

export const prepareBoth = async (
  headlessMode: boolean,
  cwd: string,
  ide: string,
  vscodePath: string,
  commit: string,
  connectionId: number,
  isFirstConnection: boolean,
  canUseIdleCallback: boolean,
  attachedToPageTimeout: number,
): Promise<any> => {
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
  const electronRpc = DebuggerCreateRpcConnection.createRpc(electronIpc)

  const { monkeyPatchedElectronId, electronObjectId } = await connectElectron(electronRpc, headlessMode)

  await DevtoolsProtocolDebugger.resume(electronRpc)

  const devtoolsWebSocketUrl = await devtoolsWebSocketUrlPromise

  const connectDevtoolsPromise = connectDevtools(devtoolsWebSocketUrl, attachedToPageTimeout)

  if (headlessMode) {
    // TODO
  }

  await DevtoolsProtocolRuntime.callFunctionOn(electronRpc, {
    functionDeclaration: MonkeyPatchElectronScript.undoMonkeyPatch,
    objectId: monkeyPatchedElectronId,
  })

  const { sessionRpc, sessionId, targetId, dispose } = await connectDevtoolsPromise

  const utilityContext = await waitForUtilityExecutionContext(sessionRpc)

  await Promise.all([electronRpc.dispose(), dispose()])

  return {
    childPid: child.pid,
    devtoolsWebSocketUrl,
    electronObjectId,
    monkeyPatchedElectronId,
    parsedVersion,
    sessionId,
    targetId,
    utilityContext,
    webSocketUrl,
  }
}
