import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.js'
import * as RunTests from '../RunTests/RunTests.js'
import * as Exit from '../Exit/Exit.js'

export const commandMap = {
  [TestWorkerCommandType.RunTests]: RunTests.runTests,
  [TestWorkerCommandType.Exit]: Exit.exit,
}
