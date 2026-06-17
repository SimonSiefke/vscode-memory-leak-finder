import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { VError } from '@lvce-editor/verror'
import * as ConnectDevtools from '../ConnectDevtools/ConnectDevtools.ts'
import * as GetTestWorkerUrl from '../GetTestWorkerUrl/GetTestWorkerUrl.ts'
import * as TestRunMode from '../TestRunMode/TestRunMode.ts'

const getExecArgv = (runMode: number): readonly string[] => {
  switch (runMode) {
    case TestRunMode.Vm:
      return ['--experimental-vm-modules']
    default:
      return []
  }
}

// TODO dispose worker on next test run
export const launchTestWorker = async (
  platform: string,
  runMode: number,
  connectionId: number,
  devtoolsWebSocketUrl: string,
  electronObjectId: string,
  webSocketUrl: string,
  idleTimeout: number,
  pageObjectPath: string,
  parsedIdeVersion: any,
  timeouts: boolean,
  utilityContext: any,
  attachdToPageTimeout: number,
  inspectSharedProcess: boolean,
  inspectExtensions: boolean,
  inspectPtyHost: boolean,
  enableExtensions: boolean,
  inspectPtyHostPort: number,
  inspectSharedProcessPort: number,
  inspectExtensionsPort: number,
  trackFunctions: boolean,
) => {
  try {
    const url = GetTestWorkerUrl.getTestWorkerUrl()
    const rpc = await NodeWorkerRpcParent.create({
      commandMap: {},
      execArgv: getExecArgv(runMode),
      path: url,
      stdio: 'inherit',
    })
    await ConnectDevtools.connectDevtools(
      rpc,
      platform,
      connectionId,
      devtoolsWebSocketUrl,
      electronObjectId,
      webSocketUrl,
      idleTimeout,
      pageObjectPath,
      parsedIdeVersion,
      timeouts,
      utilityContext,
      attachdToPageTimeout,
      inspectSharedProcess,
      inspectExtensions,
      inspectPtyHost,
      enableExtensions,
      inspectPtyHostPort,
      inspectSharedProcessPort,
      inspectExtensionsPort,
      trackFunctions,
    )
    return rpc
  } catch (error) {
    throw new VError(error, `Failed to launch test worker`)
  }
}
