import * as Assert from '../Assert/Assert.js'
import * as HandleTestFailed from '../HandleTestFailed/HandleTestFailed.js'
import * as HandleTestPassed from '../HandleTestPassed/HandleTestPassed.js'
import * as HandleTestRunning from '../HandleTestRunning/HandleTestRunning.js'
import * as HandleTestSkipped from '../HandleTestSkipped/HandleTestSkipped.js'
import * as HandleTestsFinished from '../HandleTestsFinished/HandleTestsFinished.js'
import * as HandleTestsStarting from '../HandleTestsStarting/HandleTestsStarting.js'
import * as HandleTestsUnexpectedError from '../HandleTestsUnexpectedError/HandleTestsUnexpectedError.js'
import * as TestWorkerEventType from '../TestWorkerEventType/TestWorkerEventType.js'

export const getFn = (method) => {
  Assert.string(method)
  switch (method) {
    case TestWorkerEventType.TestPassed:
      return HandleTestPassed.handleTestPassed
    case TestWorkerEventType.TestRunning:
      return HandleTestRunning.handleTestRunning
    case TestWorkerEventType.TestFailed:
      return HandleTestFailed.handleTestFailed
    case TestWorkerEventType.AllTestsFinished:
      return HandleTestsFinished.handleTestsFinished
    case TestWorkerEventType.TestsStarting:
      return HandleTestsStarting.handleTestsStarting
    case TestWorkerEventType.TestSkipped:
      return HandleTestSkipped.handleTestSkipped
    case TestWorkerEventType.UnexpectedTestError:
      return HandleTestsUnexpectedError.handleTestsUnexpectedError
    default:
      throw new Error(`method not found ${method}`)
  }
}
