import * as HandleTestStderrData from '../HandleTestStderrData/HandleTestStderrData.js'
import * as HandleTestStdoutData from '../HandleTestStdoutData/HandleTestStdoutData.js'
import * as TestCoordinator from '../TestCoordinator/TestCoordinator.js'

export const createTestCoordinatorAndListen = async () => {
  const rpc = await TestCoordinator.listen()
  // @ts-ignore
  rpc.stdout.on('data', HandleTestStdoutData.handleStdoutData)
  // @ts-ignore
  rpc.stderr.on('data', HandleTestStderrData.handleStderrData)
  return rpc
}
