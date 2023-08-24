import * as Connect from '../Connect/Connect.js'
import * as RunTest from '../RunTest/RunTest.js'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.js'

export const commandMap = {
  [TestWorkerCommandType.Connect]: Connect.connect,
  [TestWorkerCommandType.RunTest]: RunTest.runTest,
}
