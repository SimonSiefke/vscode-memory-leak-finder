import * as HandleTestFailed from '../HandleTestFailed/HandleTestFailed.js'
import * as HandleTestPassed from '../HandleTestPassed/HandleTestPassed.js'
import * as HandleTestRunning from '../HandleTestRunning/HandleTestRunning.js'
import * as HandleTestSetup from '../HandleTestSetup/HandleTestSetup.js'
import * as HandleTestSkipped from '../HandleTestSkipped/HandleTestSkipped.js'
import * as HandleTestsFinished from '../HandleTestsFinished/HandleTestsFinished.js'
import * as HandleTestsStarting from '../HandleTestsStarting/HandleTestsStarting.js'
import * as HandleTestsUnexpectedError from '../HandleTestsUnexpectedError/HandleTestsUnexpectedError.js'
import * as TestWorkerEventType from '../TestWorkerEventType/TestWorkerEventType.js'

export const commandMap = {
  [TestWorkerEventType.TestPassed]: HandleTestPassed.handleTestPassed,
  [TestWorkerEventType.TestRunning]: HandleTestRunning.handleTestRunning,
  [TestWorkerEventType.TestSetup]: HandleTestSetup.handleTestSetup,
  [TestWorkerEventType.TestFailed]: HandleTestFailed.handleTestFailed,
  [TestWorkerEventType.AllTestsFinished]: HandleTestsFinished.handleTestsFinished,
  [TestWorkerEventType.TestsStarting]: HandleTestsStarting.handleTestsStarting,
  [TestWorkerEventType.TestSkipped]: HandleTestSkipped.handleTestSkipped,
  [TestWorkerEventType.UnexpectedTestError]: HandleTestsUnexpectedError.handleTestsUnexpectedError,
}
