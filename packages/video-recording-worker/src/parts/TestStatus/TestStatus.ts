import * as Assert from '../Assert/Assert.ts'

interface State {
  currentTestName: string
  testStatus: 'running' | 'passed' | 'failed' | 'none'
}

export const state: State = {
  currentTestName: '',
  testStatus: 'none',
}

export const setTestStatus = (testName: string, status: 'running' | 'passed' | 'failed'): void => {
  Assert.string(testName)
  Assert.string(status)
  state.currentTestName = testName
  state.testStatus = status
}

export const getTestStatus = (): { testName: string; status: 'running' | 'passed' | 'failed' | 'none' } => {
  return {
    testName: state.currentTestName,
    status: state.testStatus,
  }
}
