import type { MessagePort } from 'node:worker_threads'
import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { connectDevtools } from '../ConnectDevtools/ConnectDevtools.ts'
import { connectElectron } from '../ConnectElectron/ConnectElectron.ts'
import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import * as DebuggerCreateRpcConnection from '../DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.ts'
import { DevtoolsProtocolDebugger, DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
<<<<<<< HEAD
import * as GetFunctionTrackerUrl from '../GetFunctionTrackerUrl/GetFunctionTrackerUrl.ts'
=======
import { launchFunctionTrackerAndPreGenerateWorkbench } from '../LaunchFunctionTrackerWorker/LaunchFunctionTrackerAndPreGenerateWorkbench.ts'
>>>>>>> origin/main
import * as MonkeyPatchElectronScript from '../MonkeyPatchElectronScript/MonkeyPatchElectronScript.ts'
import { PortReadStream } from '../PortReadStream/PortReadStream.ts'
import * as WaitForDebuggerListening from '../WaitForDebuggerListening/WaitForDebuggerListening.ts'
import * as WaitForDevtoolsListening from '../WaitForDevtoolsListening/WaitForDevtoolsListening.ts'

<<<<<<< HEAD
type Rpc = {
  dispose(): Promise<void>
  invoke(method: string, ...params: readonly unknown[]): Promise<unknown>
}

const emptyRpc: Rpc = {
  async dispose(): Promise<void> {},
  async invoke(): Promise<never> {
    throw new Error(`not implemented`)
  },
}
=======
// TODO maybe pass it as argument from above
const HTTP_SERVER_PORT = 9876
>>>>>>> origin/main

export const prepareBoth = async (
  secretsPath: string,
  headlessMode: boolean,
  attachedToPageTimeout: number,
  port: MessagePort,
  parsedVersion: any,
  trackFunctions: boolean,
  openDevtools: boolean,
  connectionId: number,
  measureId: string,
  pid: number,
  preGeneratedWorkbenchPath: string | null,
  binaryPath: string | null,
): Promise<any> => {
  // Launch function-tracker worker BEFORE PrepareBoth if tracking is enabled
  // This ensures the socket server is ready when the protocol interceptor is injected
  if (trackFunctions && binaryPath) {
    await launchFunctionTrackerAndPreGenerateWorkbench(binaryPath, preGeneratedWorkbenchPath)
  }

  const stream = new PortReadStream(port)
  const webSocketUrl = await WaitForDebuggerListening.waitForDebuggerListening(stream)

  const devtoolsWebSocketUrlPromise = WaitForDevtoolsListening.waitForDevtoolsListening(stream)

  const electronIpc = await DebuggerCreateIpcConnection.createConnection(webSocketUrl)
  const electronRpc = DebuggerCreateRpcConnection.createRpc(electronIpc)

  const { electronObjectId, monkeyPatchedElectronId } = await connectElectron(
    electronRpc,
    secretsPath,
    headlessMode,
    trackFunctions,
    openDevtools,
    HTTP_SERVER_PORT,
    preGeneratedWorkbenchPath,
    measureId,
  )

  // Launch function tracker worker and connect devtools BEFORE resuming debugger
  // This ensures request interception is set up before JavaScript files are loaded
  let functionTrackerRpc: Rpc = emptyRpc
  const devtoolsWebSocketUrl = await devtoolsWebSocketUrlPromise
  if (trackFunctions) {
    const functionTrackerUrl = GetFunctionTrackerUrl.getFunctionTrackerUrl()
    functionTrackerRpc = await NodeWorkerRpcParent.create({
      commandMap: {},
      execArgv: [],
      path: functionTrackerUrl,
      stdio: 'inherit',
    })
    await functionTrackerRpc.invoke('FunctionTracker.connectDevtools', devtoolsWebSocketUrl, webSocketUrl, connectionId, measureId)
  }

  await DevtoolsProtocolDebugger.resume(electronRpc)

  const connectDevtoolsPromise = connectDevtools(devtoolsWebSocketUrl, attachedToPageTimeout)

  if (headlessMode) {
    // TODO
  }

  // Always undo monkey patch immediately to allow page creation
  // When tracking, we'll pause again after function-tracker is connected
  await DevtoolsProtocolRuntime.callFunctionOn(electronRpc, {
    functionDeclaration: MonkeyPatchElectronScript.undoMonkeyPatch,
    objectId: monkeyPatchedElectronId,
  })

  // Wait for the page to be created by the initialization worker's connectDevtools
  const { dispose, sessionId, targetId } = await connectDevtoolsPromise

  await Promise.all([electronRpc.dispose(), dispose()])

  return {
    devtoolsWebSocketUrl,
    electronObjectId,
    functionTrackerRpc,
    monkeyPatchedElectronId,
    sessionId,
    targetId,
    utilityContext: undefined,
    webSocketUrl,
  }
}
