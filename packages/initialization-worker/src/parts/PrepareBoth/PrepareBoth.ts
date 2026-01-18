import type { MessagePort } from 'node:worker_threads'
import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { connectDevtools } from '../ConnectDevtools/ConnectDevtools.ts'
import { connectElectron } from '../ConnectElectron/ConnectElectron.ts'
import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import * as DebuggerCreateRpcConnection from '../DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.ts'
import { DevtoolsProtocolDebugger, DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as GetFunctionTrackerUrl from '../GetFunctionTrackerUrl/GetFunctionTrackerUrl.ts'
import * as MonkeyPatchElectronScript from '../MonkeyPatchElectronScript/MonkeyPatchElectronScript.ts'
import { PortReadStream } from '../PortReadStream/PortReadStream.ts'
import * as WaitForDebuggerListening from '../WaitForDebuggerListening/WaitForDebuggerListening.ts'
import * as WaitForDevtoolsListening from '../WaitForDevtoolsListening/WaitForDevtoolsListening.ts'

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

export const prepareBoth = async (
  headlessMode: boolean,
  attachedToPageTimeout: number,
  port: MessagePort,
  parsedVersion: any,
  trackFunctions: boolean,
  connectionId: number,
  measureId: string,
  pid: number,
): Promise<any> => {
  const stream = new PortReadStream(port)
  const webSocketUrl = await WaitForDebuggerListening.waitForDebuggerListening(stream)

  const devtoolsWebSocketUrlPromise = WaitForDevtoolsListening.waitForDevtoolsListening(stream)

  const electronIpc = await DebuggerCreateIpcConnection.createConnection(webSocketUrl)
  const electronRpc = DebuggerCreateRpcConnection.createRpc(electronIpc)

  const { electronObjectId, monkeyPatchedElectronId } = await connectElectron(electronRpc, headlessMode)

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

  await DevtoolsProtocolRuntime.callFunctionOn(electronRpc, {
    functionDeclaration: MonkeyPatchElectronScript.undoMonkeyPatch,
    objectId: monkeyPatchedElectronId,
  })

  const { dispose, sessionId, targetId } = await connectDevtoolsPromise

  // Dispose browserRpc but keep functionTrackerRpc alive (it will be disposed later by test-coordinator)
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
