import * as HandleTestFailed from '../HandleTestFailed/HandleTestFailed.ts'
import * as HandleTestPassed from '../HandleTestPassed/HandleTestPassed.ts'
import * as HandleTestRunning from '../HandleTestRunning/HandleTestRunning.ts'
import * as HandleTestSetup from '../HandleTestSetup/HandleTestSetup.ts'
import * as HandleTestSkipped from '../HandleTestSkipped/HandleTestSkipped.ts'
import * as HandleTestsFinished from '../HandleTestsFinished/HandleTestsFinished.ts'
import * as HandleTestsStarting from '../HandleTestsStarting/HandleTestsStarting.ts'
import * as HandleTestsUnexpectedError from '../HandleTestsUnexpectedError/HandleTestsUnexpectedError.ts'
import * as TestWorkerEventType from '../TestWorkerEventType/TestWorkerEventType.ts'

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
