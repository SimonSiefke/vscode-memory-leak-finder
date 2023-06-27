import * as Assert from '../Assert/Assert.js'
import * as FileWatcherEventType from '../FileWatcherEventType/FileWatcherEventType.js'
import * as HandleFileChanged from '../HandleFileChanged/HandleFileChanged.js'
import * as HandleTestFailed from '../HandleTestFailed/HandleTestFailed.js'
import * as HandleTestPassed from '../HandleTestPassed/HandleTestPassed.js'
import * as HandleTestRunning from '../HandleTestRunning/HandleTestRunning.js'
import * as HandleTestsFinished from '../HandleTestsFinished/HandleTestsFinished.js'
import * as HandleTestsStarting from '../HandleTestsStarting/HandleTestsStarting.js'
import * as TestWorkerEventType from '../TestWorkerEventType/TestWorkerEventType.js'

const getFn = (method) => {
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
    case FileWatcherEventType.HandleFileChanged:
      return HandleFileChanged.handleFileChanged
    default:
      throw new Error(`method not found ${method}`)
  }
}

export const execute = (method, ...params) => {
  const fn = getFn(method)
  fn(...params)
}
