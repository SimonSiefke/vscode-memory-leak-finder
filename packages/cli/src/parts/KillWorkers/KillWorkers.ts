import * as RunTest from '../RunTest/RunTest.ts'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.ts'
import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'

export const killWorkers = async () => {
  if (RunTest.state.testCoordinator) {
    // TODO decide whether it is better to dispose the worker from here or let the worker dispose itself
    RunTest.state.testCoordinator.send(TestWorkerCommandType.Exit)
    RunTest.state.testCoordinator = undefined
  }
  if (StdoutWorker.state.rpc) {
    await StdoutWorker.state.rpc.dispose()
  }
  StdoutWorker.state.rpc = undefined
}
