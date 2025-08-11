import * as DevtoolsTargetType from '../DevtoolsTargetType/DevtoolsTargetType.ts'
import * as Page from '../Page/Page.ts'
import * as SessionState from '../SessionState/SessionState.ts'
import * as TargetState from '../TargetState/TargetState.ts'

export const waitForPage = async ({ index, electronRpc, electronObjectId }) => {
  const target = await TargetState.waitForTarget({ type: DevtoolsTargetType.Page, index })
  const session = SessionState.getSession(target.sessionId)
  const rpc = session.rpc
  return Page.create({
    electronObjectId,
    electronRpc,
    sessionId: target.sessionId,
    targetId: target.targetId,
    rpc,
  })
}
