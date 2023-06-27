import { once } from 'node:events'
import * as HandleStdinData from '../HandleStdinData/HandleStdinData.js'
import * as JsonRpc from '../JsonRpc/JsonRpc.js'
import * as RunTest from '../RunTest/RunTest.js'
import * as Stdin from '../Stdin/Stdin.js'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.js'

// TODO how to kill all child processes recursively?
//

export const handleExit = async () => {
  Stdin.off('data', HandleStdinData.handleStdinData)
  Stdin.pause()
  // console.log('kill proces group')
  // kill process group
  // process.kill(process.pid)
  console.log('start exiting')

  if (RunTest.state.testWorker) {
    console.log('has worker')
    const s = performance.now()
    JsonRpc.send(RunTest.state.testWorker, TestWorkerCommandType.Exit)
    await once(RunTest.state.testWorker, 'exit')
    const e = performance.now()
    console.log(`took ${e - s}ms`)
    console.log('worker has terminated')
    const used = process.memoryUsage().heapUsed / 1024 / 1024
    console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`)
  }
}
