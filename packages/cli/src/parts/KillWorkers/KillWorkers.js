import * as RunTest from '../RunTest/RunTest.js'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.js'
import * as JsonRpc from '../JsonRpc/JsonRpc.js'
import * as StdoutWorker from '../StdoutWorker/StdoutWorker.js'

export const killWorkers = async () => {
  if (RunTest.state.testCoordinator) {
    JsonRpc.send(RunTest.state.testCoordinator, TestWorkerCommandType.Exit)

    RunTest.state.testCoordinator = undefined
  }
  await StdoutWorker.state.ipc.dispose()
  StdoutWorker.state.ipc = undefined
}
