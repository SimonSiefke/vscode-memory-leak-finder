import * as DevtoolsTargetType from '../DevtoolsTargetType/DevtoolsTargetType.ts'
import * as Page from '../Page/Page.ts'
// import * as SessionState from '../SessionState/SessionState.ts'

export const waitForIframe = async ({ electronRpc, url, electronObjectId, idleTimeout }) => {
  const target = await TargetState.waitForTarget({
    type: DevtoolsTargetType.Iframe,
    url,
  })
  const session = SessionState.getSession(target.sessionId)
  const { rpc } = session
  return Page.create({
    electronObjectId,
    electronRpc,
    sessionId: target.sessionId,
    targetId: target.targetId,
    rpc,
    idleTimeout,
  })
}
