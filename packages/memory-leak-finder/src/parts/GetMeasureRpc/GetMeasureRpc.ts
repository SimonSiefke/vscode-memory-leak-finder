import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import { DevtoolsProtocolRuntime, DevtoolsProtocolTarget } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import { waitForSession } from '../WaitForSession/WaitForSession.ts'
import { connectToDevtoolsWithJsonUrl } from '../ConnectToDevtoolsWithJsonUrl/ConnectToDevtoolsWithJsonUrl.ts'

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

  // Connect to the appropriate debug port based on the flags
  if (inspectSharedProcess) {
    await sessionRpc.dispose()
    const sharedProcessRpc = await connectToDevtoolsWithJsonUrl(SHARED_PROCESS_PORT)
    return sharedProcessRpc
  }
  if (inspectExtensions) {
    await sessionRpc.dispose()
    const extensionsRpc = await connectToDevtoolsWithJsonUrl(EXTENSIONS_PORT)
    return extensionsRpc
  }
  if (inspectPtyHost) {
    await sessionRpc.dispose()
    const ptyhostRpc = await connectToDevtoolsWithJsonUrl(PTYHOST_PORT)
    return ptyhostRpc
  }
  if (measureNode) {
    await sessionRpc.dispose()
    const electronRpc = await DebuggerCreateIpcConnection.createConnection(electronWebSocketUrl)
    return electronRpc
  }

  await Promise.all([
    DevtoolsProtocolTarget.setAutoAttach(sessionRpc, {
      autoAttach: true,
      waitForDebuggerOnStart: false,
      flatten: true,
    }),
  ])

  return sessionRpc
}
