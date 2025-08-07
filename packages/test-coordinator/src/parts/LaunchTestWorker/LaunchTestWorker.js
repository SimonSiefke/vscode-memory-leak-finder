import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import * as GetTestWorkerUrl from '../GetTestWorkerUrl/GetTestWorkerUrl.js'
import * as TestRunMode from '../TestRunMode/TestRunMode.js'
import { VError } from '@lvce-editor/verror'

const getExecArgv = (runMode) => {
  switch (runMode) {
    case TestRunMode.Vm:
      return ['--experimental-vm-modules']
    default:
      return []
  }
}

// TODO dispose worker on next test run
export const launchTestWorker = async (runMode) => {
  try {
    const url = GetTestWorkerUrl.getTestWorkerUrl()
    const rpc = await NodeWorkerRpcParent.create({
      path: url,
      stdio: 'inherit',
      execArgv: getExecArgv(runMode),
      commandMap: {},
    })
    return rpc
  } catch (error) {
    throw new VError(error, `Failed to launch test worker`)
  }
}
