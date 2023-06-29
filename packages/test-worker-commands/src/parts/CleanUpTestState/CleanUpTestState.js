import * as ExecutionContextState from '../ExecutionContextState/ExecutionContextState.js'
import * as SessionState from '../SessionState/SessionState.js'
import * as TargetState from '../TargetState/TargetState.js'
import { TestFinishedError } from '../TestFinishedError/TestFinishedError.js'
import * as Time from '../Time/Time.js'

export const cleanUpTestState = () => {
  try {
    const s = Time.now()
    const sessions = SessionState.getAllSessions()
    for (const session of sessions) {
      session.rpc.listeners = Object.create(null)
      for (const callback of Object.values(session.rpc.callbacks)) {
        callback.reject(new TestFinishedError())
      }
      session.rpc.callbacks = Object.create(null)
    }
    SessionState.reset()
    TargetState.reset()
    ExecutionContextState.reset()
    const e = Time.now()
    // console.log('clean up finished in ', e - s, 'ms')
  } catch (error) {
    console.error(`Failed to clean up test state ${error}`)
    console.log(error)
  }
}
