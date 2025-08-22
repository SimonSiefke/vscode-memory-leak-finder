import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { VError } from '@lvce-editor/verror'
import * as GetTestWorkerUrl from '../GetTestWorkerUrl/GetTestWorkerUrl.ts'
import * as TestRunMode from '../TestRunMode/TestRunMode.ts'

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
