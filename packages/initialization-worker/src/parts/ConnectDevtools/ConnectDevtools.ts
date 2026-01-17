import { NodeForkedProcessRpcParent } from '@lvce-editor/rpc'
import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import * as DebuggerCreateRpcConnection from '../DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as GetFunctionTrackerUrl from '../GetFunctionTrackerUrl/GetFunctionTrackerUrl.ts'
import { waitForSession } from '../WaitForSession/WaitForSession.ts'

export const connectDevtools = async (
  devtoolsWebSocketUrl: string,
  attachedToPageTimeout: number,
  trackFunctions: boolean,
  webSocketUrl: string,
  connectionId: number,
  measureId: string,
  pid: number,
): Promise<any> => {
  const browserIpc = await DebuggerCreateIpcConnection.createConnection(devtoolsWebSocketUrl)
  const browserRpc = DebuggerCreateRpcConnection.createRpc(browserIpc)
  const { sessionId, sessionRpc, targetId } = await waitForSession(browserRpc, attachedToPageTimeout)

  console.log('ses', sessionId)
  const functionTrackerRpc: any = undefined
  if (trackFunctions) {
    // const functionTrackerUrl = GetFunctionTrackerUrl.getFunctionTrackerUrl()
    // functionTrackerRpc = await NodeForkedProcessRpcParent.create({
    //   commandMap: {},
    //   execArgv: [],
    //   path: functionTrackerUrl,
    //   stdio: 'inherit',
    // })
    // await functionTrackerRpc.invoke(
    //   'FunctionTracker.connectDevtools',
    //   devtoolsWebSocketUrl,
    //   webSocketUrl,
    //   connectionId,
    //   measureId,
    //   attachedToPageTimeout,
    //   pid,
    // )
    // console.log('done')
  } else {
  }
  sessionRpc.on('Fetch.requestPaused', (event) => {
    console.log('paused', event)
  })
  const r = await sessionRpc.invoke('Fetch.enable', {
    patterns: [
      {
        resourceType: 'Script',
        // urlPattern: '*.js', requestStage: 'Request'
      },
    ],
  })
  console.log({ r })

  await DevtoolsProtocolRuntime.runIfWaitingForDebugger(sessionRpc)
  console.log('continue')
  return {
    async dispose() {
      console.log('dispoing...')
      // Don't dispose functionTrackerRpc here - it will be disposed by test-coordinator
      // await browserRpc.dispose()
    },
    sessionId,
    sessionRpc,
    targetId,
  }
}
