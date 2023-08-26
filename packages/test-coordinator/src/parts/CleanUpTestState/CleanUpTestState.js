import * as ExecutionContextState from '../ExecutionContextState/ExecutionContextState.js'
import * as Time from '../Time/Time.js'

export const cleanUpTestState = () => {
  try {
    const s = Time.now()
    ExecutionContextState.reset()
    const e = Time.now()
    // console.log('clean up finished in ', e - s, 'ms')
  } catch (error) {
    console.error(`Failed to clean up test state ${error}`)
    console.log(error)
  }
}
