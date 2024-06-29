import * as DevtoolsTargetType from '../DevtoolsTargetType/DevtoolsTargetType.js'
import * as SessionState from '../SessionState/SessionState.js'
import * as TargetState from '../TargetState/TargetState.js'

export const waitForPage = async ({ index }) => {
  const target = await TargetState.waitForTarget({ type: DevtoolsTargetType.Page, index })
  const session = SessionState.getSession(target.sessionId)
  const rpc = session.rpc
  return {
    sessionId: target.sessionId,
    targetId: target.targetId,
    rpc,
  }
}
