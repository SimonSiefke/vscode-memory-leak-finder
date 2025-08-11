import * as Page from '../Page/Page.ts'
import * as SessionState from '../SessionState/SessionState.ts'
import * as TargetState from '../TargetState/TargetState.ts'
import * as DevtoolsTargetType from '../DevtoolsTargetType/DevtoolsTargetType.ts'

export const waitForIframe = async ({ electronRpc, url, electronObjectId }) => {
  const target = await TargetState.waitForTarget({
    type: DevtoolsTargetType.Iframe,
    url,
  })
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
