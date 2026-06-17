import type { Dynamic } from '../Types/Types.ts'
import { connectToDevtoolsWithJsonUrl } from '../ConnectToDevtoolsWithJsonUrl/ConnectToDevtoolsWithJsonUrl.ts'
import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import { DevtoolsProtocolTarget } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as GetIntegratedBrowserMeasureRpc from '../GetIntegratedBrowserMeasureRpc/GetIntegratedBrowserMeasureRpc.ts'
import { waitForSession } from '../WaitForSession/WaitForSession.ts'
export const getMeasureRpc = async (
  devtoolsWebSocketUrl: string,
  electronWebSocketUrl: string,
  attachedToPageTimeout: number,
  measureNode: boolean,
  inspectSharedProcess: boolean,
  inspectExtensions: boolean,
  inspectIntegratedBrowser: boolean,
  inspectPtyHost: boolean,
  inspectPtyHostPort: number,
  inspectSharedProcessPort: number,
  inspectExtensionsPort: number,
  excludedTargetIds: readonly string[],
): Promise<Dynamic> => {
  const browserRpc = await DebuggerCreateIpcConnection.createConnection(devtoolsWebSocketUrl)
  if (inspectIntegratedBrowser) {
    return GetIntegratedBrowserMeasureRpc.getIntegratedBrowserMeasureRpc(browserRpc, excludedTargetIds)
  }
  const { sessionRpc } = await waitForSession(browserRpc, attachedToPageTimeout)
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
