import { Readable } from 'node:stream'
import { MessagePort } from 'node:worker_threads'
import { connectDevtools } from '../ConnectDevtools/ConnectDevtools.ts'
import { connectElectron } from '../ConnectElectron/ConnectElectron.ts'
import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import * as DebuggerCreateRpcConnection from '../DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.ts'
import { DevtoolsProtocolDebugger, DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as MonkeyPatchElectronScript from '../MonkeyPatchElectronScript/MonkeyPatchElectronScript.ts'
import * as WaitForDebuggerListening from '../WaitForDebuggerListening/WaitForDebuggerListening.ts'
import * as WaitForDevtoolsListening from '../WaitForDevtoolsListening/WaitForDevtoolsListening.ts'
import { waitForUtilityExecutionContext } from '../WaitForUtilityExecutionContext/WaitForUtilityExecutionContext.ts'

class PortReadStream extends Readable {
  port: MessagePort

  constructor(port: MessagePort) {
    super({ objectMode: true })
    this.port = port
    this.port.on('message', () => {})
  }

  _read(size: number): void {}

  handleMessage(event) {
    this.push(event.data)
  }
}

export const prepareBoth = async (headlessMode: boolean, attachedToPageTimeout: number, port: MessagePort): Promise<any> => {
  const stream = new PortReadStream(port)
  const webSocketUrl = await WaitForDebuggerListening.waitForDebuggerListening(stream)

  const devtoolsWebSocketUrlPromise = WaitForDevtoolsListening.waitForDevtoolsListening(stream)

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
