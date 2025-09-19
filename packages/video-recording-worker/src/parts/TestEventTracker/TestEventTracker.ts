import * as Assert from '../Assert/Assert.ts'

interface TestEvent {
  timestamp: number
  testName: string
  status: 'running' | 'passed' | 'failed'
}

interface State {
  testEvents: TestEvent[]
  startTime: number
}

export const state: State = {
  testEvents: [],
  startTime: 0,
}

export const initialize = (): void => {
  state.testEvents = []
  state.startTime = Date.now()
}

export const addTestEvent = (testName: string, status: 'running' | 'passed' | 'failed'): void => {
  Assert.string(testName)
  Assert.string(status)

  const timestamp = (Date.now() - state.startTime) / 1000 // Convert to seconds
  state.testEvents.push({
    testName,
    status,
    timestamp,
  })
}

export const getTestEvents = (): readonly TestEvent[] => {
  return state.testEvents
}
