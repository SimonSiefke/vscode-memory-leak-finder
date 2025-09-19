import * as Assert from '../Assert/Assert.ts'
import * as TestEventTracker from '../TestEventTracker/TestEventTracker.ts'
import * as TestStatus from '../TestStatus/TestStatus.ts'

export const setTestStatus = (testName: string, status: 'running' | 'passed' | 'failed'): void => {
  Assert.string(testName)
  Assert.string(status)
  TestStatus.setTestStatus(testName, status)
  TestEventTracker.addTestEvent(testName, status)
}
