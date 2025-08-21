import * as RunTest from '../RunTest/RunTest.ts'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.ts'
import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'

export const killWorkers = async (): Promise<void> => {
  if (RunTest.state.testCoordinator) {
    await RunTest.state.testCoordinator.invoke(TestWorkerCommandType.PrepareExit)
    // TODO decide whether it is better to dispose the worker from here or let the worker dispose itself
    RunTest.state.testCoordinator.send(TestWorkerCommandType.Exit)
    RunTest.state.testCoordinator = undefined
  }
  await StdoutWorker.cleanup()
}
