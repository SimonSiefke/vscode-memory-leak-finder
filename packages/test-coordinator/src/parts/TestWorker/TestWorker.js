import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import * as GetTestWorkerUrl from '../GetTestWorkerUrl/GetTestWorkerUrl.js'
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
  return rpc
}
