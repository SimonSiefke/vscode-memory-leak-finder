import * as HandleTestStderrData from '../HandleTestStderrData/HandleTestStderrData.js'
import * as HandleTestStdoutData from '../HandleTestStdoutData/HandleTestStdoutData.js'
import * as IpcParentType from '../IpcParentType/IpcParentType.js'
import * as TestCoordinator from '../TestCoordinator/TestCoordinator.js'

export const createTestCoordinatorAndListen = async () => {
  const worker = await TestCoordinator.listen(IpcParentType.NodeWorkerThread)
  worker.stdout.on('data', HandleTestStdoutData.handleStdoutData)
  worker.stderr.on('data', HandleTestStderrData.handleStderrData)
  return worker
}
