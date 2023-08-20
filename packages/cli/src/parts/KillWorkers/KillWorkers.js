import * as JsonRpc from '../JsonRpc/JsonRpc.js'
import * as RunTest from '../RunTest/RunTest.js'
import * as RunTestWatcher from '../RunTestWatcher/RunTestWatcher.js'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.js'

// TODO how to kill all child processes recursively?
//

export const killWorkers = async () => {
  if (RunTest.state.testCoordinator) {
    // console.log('has worker')
    // const s = performance.now()
    JsonRpc.send(RunTest.state.testCoordinator, TestWorkerCommandType.Exit)
    // await once(RunTest.state.testWorker, 'exit')
    RunTest.state.testCoordinator = undefined
    // const e = performance.now()
    // console.log(`took ${e - s}ms`)
    // console.log('worker has terminated')
    // const used = process.memoryUsage().heapUsed / 1024 / 1024
    // console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`)
  }
  if (RunTestWatcher.state.fileWatcherWorker) {
    RunTestWatcher.state.fileWatcherWorker.dispose()
    RunTestWatcher.state.fileWatcherWorker = undefined
  }
}
