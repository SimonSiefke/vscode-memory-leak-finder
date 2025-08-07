import * as RunTest from '../RunTest/RunTest.ts'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.ts'

export const killWorkers = async () => {
  if (RunTest.state.testCoordinator) {
    // TODO decide whether it is better to dispose the worker from here or let the worker dispose itself
    RunTest.state.testCoordinator.send(TestWorkerCommandType.Exit)
    RunTest.state.testCoordinator = undefined
  }
}
