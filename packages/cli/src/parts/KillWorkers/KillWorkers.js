import * as RunTest from '../RunTest/RunTest.js'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.js'
import * as JsonRpc from '../JsonRpc/JsonRpc.js'

export const killWorkers = () => {
  if (RunTest.state.testCoordinator) {
    JsonRpc.send(RunTest.state.testCoordinator, TestWorkerCommandType.Exit)

    RunTest.state.testCoordinator = undefined
  }
}
