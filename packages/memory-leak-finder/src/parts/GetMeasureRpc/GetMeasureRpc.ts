import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import { DevtoolsProtocolRuntime, DevtoolsProtocolTarget } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import { waitForSession } from '../WaitForSession/WaitForSession.ts'

export const getMeasureRpc = async (
  devtoolsWebSocketUrl: string,
  electronWebSocketUrl: string,
  attachedToPageTimeout: number,
  measureNode: boolean,
  inspectSharedProcess: boolean,
  inspectExtensions: boolean,
  inspectPtyHost: boolean,
): Promise<any> => {
  // Default debug ports for utility processes
  const SHARED_PROCESS_PORT = 5879
  const EXTENSIONS_PORT = 5870
  const PTYHOST_PORT = 5877

  const browserRpc = await DebuggerCreateIpcConnection.createConnection(devtoolsWebSocketUrl)
  const { sessionRpc } = await waitForSession(browserRpc, attachedToPageTimeout)
  await Promise.all([
    DevtoolsProtocolTarget.setAutoAttach(sessionRpc, {
      autoAttach: true,
      waitForDebuggerOnStart: false,
      flatten: true,
    }),
    DevtoolsProtocolRuntime.enable(sessionRpc),
    DevtoolsProtocolRuntime.runIfWaitingForDebugger(sessionRpc),
  ])

  // Connect to the appropriate debug port based on the flags
  if (inspectSharedProcess) {
    console.log(`[Memory Leak Finder] Connecting to shared process debug port ${SHARED_PROCESS_PORT}`)
    const sharedProcessRpc = await DebuggerCreateIpcConnection.createConnection(`ws://localhost:${SHARED_PROCESS_PORT}`)
    await Promise.all([DevtoolsProtocolRuntime.enable(sharedProcessRpc), DevtoolsProtocolRuntime.runIfWaitingForDebugger(sharedProcessRpc)])
    return sharedProcessRpc
  }
  if (inspectExtensions) {
    console.log(`[Memory Leak Finder] Connecting to extensions process debug port ${EXTENSIONS_PORT}`)
    const extensionsRpc = await DebuggerCreateIpcConnection.createConnection(`ws://localhost:${EXTENSIONS_PORT}`)
    await Promise.all([DevtoolsProtocolRuntime.enable(extensionsRpc), DevtoolsProtocolRuntime.runIfWaitingForDebugger(extensionsRpc)])
    return extensionsRpc
  }
  if (inspectPtyHost) {
    console.log(`[Memory Leak Finder] Connecting to ptyhost process debug port ${PTYHOST_PORT}`)
    const ptyhostRpc = await DebuggerCreateIpcConnection.createConnection(`ws://localhost:${PTYHOST_PORT}`)
    await Promise.all([DevtoolsProtocolRuntime.enable(ptyhostRpc), DevtoolsProtocolRuntime.runIfWaitingForDebugger(ptyhostRpc)])
    return ptyhostRpc
  }
  if (measureNode) {
    const electronRpc = await DebuggerCreateIpcConnection.createConnection(electronWebSocketUrl)
    return electronRpc
  }

  return sessionRpc
}
