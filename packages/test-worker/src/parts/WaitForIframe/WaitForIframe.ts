// import * as SessionState from '../SessionState/SessionState.ts'

export const waitForIframe = async ({ electronRpc, url, electronObjectId, idleTimeout }) => {
  throw new Error(`not implemented`)
  // const target = await TargetState.waitForTarget({
  //   type: DevtoolsTargetType.Iframe,
  //   url,
  // })
  // const session = SessionState.getSession(target.sessionId)
  // const { rpc } = session
  // return Page.create({
  //   electronObjectId,
  //   electronRpc,
  //   sessionId: target.sessionId,
  //   targetId: target.targetId,
  //   rpc,
  //   idleTimeout,
  // })
}
