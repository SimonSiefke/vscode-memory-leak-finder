import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.ts'
import { waitForSubFrameContextEvent } from '../WaitForSubFrameContextEvent/WaitForSubFrameContextEvent.ts'

export const waitForSubFrame = (rpc, urlRegex, timeout) => {
  return waitForSubFrameContextEvent(rpc, urlRegex, timeout)
}
