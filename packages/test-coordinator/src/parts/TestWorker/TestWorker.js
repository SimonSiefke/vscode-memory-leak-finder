import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import * as Callback from '../Callback/Callback.js'
import * as Command from '../Command/Command.js'
import * as GetTestWorkerUrl from '../GetTestWorkerUrl/GetTestWorkerUrl.js'
import * as HandleIpc from '../HandleIpc/HandleIpc.js'
import * as TestRunMode from '../TestRunMode/TestRunMode.js'

const getExecArgv = (runMode) => {
  switch (runMode) {
    case TestRunMode.Vm:
      return ['--experimental-vm-modules']
    default:
      return []
  }
}

// TODO dispose worker on next test run
export const launch = async (runMode) => {
  const url = GetTestWorkerUrl.getTestWorkerUrl()
  const rpc = await NodeWorkerRpcParent.create({
    path: url,
    stdio: 'inherit',
    execArgv: getExecArgv(runMode),
    commandMap: {},
  })
  HandleIpc.handleIpc(rpc, Command.execute, Callback.resolve)
  return rpc
}
