import * as HandleTestStderrData from '../HandleTestStderrData/HandleTestStderrData.ts'
import * as HandleTestStdoutData from '../HandleTestStdoutData/HandleTestStdoutData.ts'
import * as TestCoordinator from '../TestCoordinator/TestCoordinator.ts'

export const createTestCoordinatorAndListen = async () => {
  const rpc = await TestCoordinator.listen()
  // @ts-ignore
  rpc.stdout.on('data', HandleTestStdoutData.handleStdoutData)
  // @ts-ignore
  rpc.stderr.on('data', HandleTestStderrData.handleStderrData)
  return rpc
}
