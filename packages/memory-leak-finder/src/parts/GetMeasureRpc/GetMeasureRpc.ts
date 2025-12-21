import { connectToDevtoolsWithJsonUrl } from '../ConnectToDevtoolsWithJsonUrl/ConnectToDevtoolsWithJsonUrl.ts'
import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import { DevtoolsProtocolTarget } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import { waitForSession } from '../WaitForSession/WaitForSession.ts'

export const getMeasureRpc = async (
  devtoolsWebSocketUrl: string,
  electronWebSocketUrl: string,
  attachedToPageTimeout: number,
  measureNode: boolean,
  inspectSharedProcess: boolean,
  inspectExtensions: boolean,
  inspectPtyHost: boolean,
  inspectPtyHostPort: number,
  inspectSharedProcessPort: number,
  inspectExtensionsPort: number,
): Promise<any> => {
  const browserRpc = await DebuggerCreateIpcConnection.createConnection(devtoolsWebSocketUrl)
  const { sessionRpc } = await waitForSession(browserRpc, attachedToPageTimeout)

  // Connect to the appropriate debug port based on the flags
  if (inspectSharedProcess) {
    await sessionRpc.dispose()
    const sharedProcessRpc = await connectToDevtoolsWithJsonUrl(inspectSharedProcessPort)
    return sharedProcessRpc
  }
  if (inspectExtensions) {
    await sessionRpc.dispose()
    const extensionsRpc = await connectToDevtoolsWithJsonUrl(inspectExtensionsPort)
    return extensionsRpc
  }
  if (inspectPtyHost) {
    await sessionRpc.dispose()
    const ptyhostRpc = await connectToDevtoolsWithJsonUrl(inspectPtyHostPort)
    return ptyhostRpc
  }
  if (measureNode) {
    await sessionRpc.dispose()
    const electronRpc = await DebuggerCreateIpcConnection.createConnection(electronWebSocketUrl)
    return electronRpc
  }

  await DevtoolsProtocolTarget.setAutoAttach(sessionRpc, {
      autoAttach: true,
      flatten: true,
      waitForDebuggerOnStart: false,
    })

  return sessionRpc
}
